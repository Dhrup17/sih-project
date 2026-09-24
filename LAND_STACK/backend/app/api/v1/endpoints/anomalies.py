from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.anomalies import Anomaly
from app.models.parcel import Parcel
from app.schemas.anomaly import AnomalyCreate, AnomalyOut, AnomalyStatusUpdate
from app.core.deps import get_current_active_user, require_role

router = APIRouter()

@router.get("/", response_model=List[AnomalyOut])
def list_anomalies(
    status: Optional[str] = None,
    ulpin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    q = db.query(Anomaly)
    if status:
        q = q.filter(Anomaly.status == status)
    if ulpin:
        q = q.filter(Anomaly.ulpin == ulpin)
    anomalies = q.order_by(Anomaly.detected_at.desc()).all()
    return [AnomalyOut.model_validate(a) for a in anomalies]

@router.get("/{anomaly_id}", response_model=AnomalyOut)
def get_anomaly(
    anomaly_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return AnomalyOut.model_validate(anomaly)

@router.post("/", response_model=AnomalyOut)
def create_anomaly(
    anomaly_in: AnomalyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    parcel = db.query(Parcel).filter(Parcel.ulpin == anomaly_in.ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    anomaly = Anomaly(
        ulpin=anomaly_in.ulpin,
        detection_type=anomaly_in.detection_type,
        description=anomaly_in.description,
        confidence_score=anomaly_in.confidence_score,
        image_before_path=anomaly_in.image_before_path,
        image_after_path=anomaly_in.image_after_path,
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)
    return AnomalyOut.model_validate(anomaly)

@router.put("/{anomaly_id}/status", response_model=AnomalyOut)
def update_anomaly_status(
    anomaly_id: int,
    status_update: AnomalyStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    anomaly.status = status_update.status
    db.commit()
    db.refresh(anomaly)
    return AnomalyOut.model_validate(anomaly)

@router.post("/detect", response_model=AnomalyOut)
def run_change_detection(
    ulpin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    import random
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    detection_types = ["LandUseChange", "NewConstruction", "Encroachment", "Deforestation"]
    descriptions = {
        "LandUseChange": f"Potential land use change detected on parcel {ulpin}. Agricultural zone shows signs of commercial activity.",
        "NewConstruction": f"New structure detected on parcel {ulpin}. Unauthorized construction on agricultural-zoned land.",
        "Encroachment": f"Boundary encroachment detected on parcel {ulpin}. Structure extends beyond registered boundary.",
        "Deforestation": f"Vegetation loss detected on parcel {ulpin}. Significant tree cover reduction observed.",
    }
    det_type = random.choice(detection_types)
    anomaly = Anomaly(
        ulpin=ulpin,
        detection_type=det_type,
        description=descriptions[det_type],
        confidence_score=round(random.uniform(0.65, 0.98), 2),
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)
    return AnomalyOut.model_validate(anomaly)
