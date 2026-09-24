
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class OwnershipStatus(str, enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    DISPUTED = 'disputed'


class OwnershipROR(Base):
    __tablename__ = 'ownership_ror'

    id = Column(Integer, primary_key=True, index=True)
    parcel_ulpin = Column(String(36), ForeignKey('parcels.ulpin'), nullable=False)
    owner_name = Column(String(255), nullable=False)
    share = Column(Float, nullable=False)  # percentage share (0-100)
    status = Column(String(50), default='approved')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parcel = relationship('Parcel', back_populates='ownership_records')

    def __repr__(self):
        return f'<OwnershipROR {self.id}>'

