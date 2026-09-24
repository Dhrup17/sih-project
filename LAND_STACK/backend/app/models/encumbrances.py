from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Encumbrance(Base):
    __tablename__ = "encumbrances"

    id = Column(Integer, primary_key=True, index=True)
    parcel_ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # Mortgage, CourtStay, TaxLien, etc.
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String, default="Active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    parcel = relationship("Parcel", back_populates="encumbrances")