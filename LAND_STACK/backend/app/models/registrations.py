from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    parcel_ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    registration_number = Column(String, unique=True, nullable=False, index=True)
    registration_date = Column(Date, nullable=False)
    parties = Column(Text, nullable=True)  # JSON as text for SQLite
    consideration_amount = Column(Integer, nullable=True)
    registered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    parcel = relationship("Parcel", back_populates="registrations")
    registered_by_user = relationship("User")