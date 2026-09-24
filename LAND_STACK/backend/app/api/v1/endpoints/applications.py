from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.applications import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.parcel import Parcel
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationDetail, ApplicationStatusUpdate, StatusHistoryOut
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.post("/", response_model=ApplicationOut)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    parcel = db.query(Parcel).filter(Parcel.ulpin == app_in.ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    application = Application(
        ulpin=app_in.ulpin,
        type=app_in.type,
        applicant_id=current_user.id,
        status="Submitted",
        comments=app_in.comments,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    history = ApplicationStatusHistory(
        application_id=application.id,
        status="Submitted",
        changed_by=current_user.id,
        comments="Application submitted",
    )
    db.add(history)
    db.commit()
    return ApplicationOut.model_validate(application)

@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    status: Optional[str] = None,
    ulpin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Application)
    if current_user.role == UserRole.CITIZEN:
        q = q.filter(Application.applicant_id == current_user.id)
    if status:
        q = q.filter(Application.status == status)
    if ulpin:
        q = q.filter(Application.ulpin == ulpin)
    applications = q.order_by(Application.submitted_at.desc()).all()
    return [ApplicationOut.model_validate(a) for a in applications]

@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    application = (
        db.query(Application)
        .options(joinedload(Application.status_history))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.CITIZEN and application.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    applicant = db.query(User).filter(User.id == application.applicant_id).first()
    parcel = db.query(Parcel).filter(Parcel.ulpin == application.ulpin).first()
    return ApplicationDetail(
        id=application.id,
        ulpin=application.ulpin,
        type=application.type,
        applicant_id=application.applicant_id,
        status=application.status,
        submitted_at=application.submitted_at,
        updated_at=application.updated_at,
        decided_at=application.decided_at,
        decided_by=application.decided_by,
        comments=application.comments,
        status_history=[StatusHistoryOut.model_validate(h) for h in application.status_history],
        applicant_name=applicant.name if applicant else None,
        parcel_survey_number=parcel.survey_number if parcel else None,
    )

@router.put("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    old_status = application.status
    application.status = status_update.status
    if status_update.status in ("Approved", "Rejected"):
        application.decided_at = datetime.utcnow()
        application.decided_by = current_user.id
    if status_update.comments:
        application.comments = status_update.comments
    history = ApplicationStatusHistory(
        application_id=application.id,
        status=status_update.status,
        changed_by=current_user.id,
        comments=f"Status changed from {old_status} to {status_update.status}. {status_update.comments or ''}",
    )
    db.add(history)
    db.commit()
    db.refresh(application)
    return ApplicationOut.model_validate(application)
