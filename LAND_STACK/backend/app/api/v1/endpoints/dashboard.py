from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.applications import Application
from app.models.anomalies import Anomaly
from app.models.parcel import Parcel
from app.core.deps import require_role

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN)),
):
    total_parcels = db.query(func.count(Parcel.ulpin)).scalar()
    pending_applications = db.query(func.count(Application.id)).filter(
        Application.status.in_(["Submitted", "UnderReview"])
    ).scalar()
    approved_applications = db.query(func.count(Application.id)).filter(
        Application.status == "Approved"
    ).scalar()
    rejected_applications = db.query(func.count(Application.id)).filter(
        Application.status == "Rejected"
    ).scalar()
    total_anomalies = db.query(func.count(Anomaly.id)).filter(
        Anomaly.status.in_(["New", "UnderInvestigation"])
    ).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    open_disputes = db.query(func.count(Application.id)).filter(
        Application.type == "Dispute"
    ).scalar()

    return {
        "total_parcels": total_parcels,
        "pending_applications": pending_applications,
        "approved_applications": approved_applications,
        "rejected_applications": rejected_applications,
        "ai_anomaly_alerts": total_anomalies,
        "open_disputes": open_disputes,
        "total_users": total_users,
    }
