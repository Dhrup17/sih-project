from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # OwnershipTransfer, LandUseChange, Mutation, NewConstructionPermission, etc.
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="Submitted", nullable=False)  # Submitted, UnderReview, Approved, Rejected, etc.
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    comments = Column(Text, nullable=True)

    parcel = relationship("Parcel", back_populates="applications")
    applicant = relationship("User", foreign_keys=[applicant_id])
    decider = relationship("User", foreign_keys=[decided_by], overlaps="decisions_made", viewonly=True)
    status_history = relationship("ApplicationStatusHistory", back_populates="application", order_by="ApplicationStatusHistory.changed_at")