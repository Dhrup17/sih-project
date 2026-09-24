from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class TaxRecord(Base):
    __tablename__ = "tax_records"

    id = Column(Integer, primary_key=True, index=True)
    parcel_ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    assessment_year = Column(Integer, nullable=False)
    tax_amount = Column(Integer, nullable=False)  # Integer for SQLite compatibility
    status = Column(String, default="Pending", nullable=False)
    due_date = Column(Date, nullable=True)
    paid_date = Column(Date, nullable=True)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    parcel = relationship("Parcel", back_populates="tax_records")