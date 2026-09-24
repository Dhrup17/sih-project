from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import uuid


class Parcel(Base):
    __tablename__ = 'parcels'

    ulpin = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    survey_number = Column(String(100), nullable=False)
    area = Column(Float, nullable=False)  # in square meters
    geometry = Column(Text, nullable=False)  # GeoJSON Polygon string (SRID 4326)
    land_use = Column(String(100))  # Agricultural, Residential, Commercial, Industrial, Forest
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    ownership_records = relationship('OwnershipROR', back_populates='parcel', cascade='all, delete-orphan')
    registrations = relationship('Registration', back_populates='parcel', cascade='all, delete-orphan')
    tax_records = relationship('TaxRecord', back_populates='parcel', cascade='all, delete-orphan')
    encumbrances = relationship('Encumbrance', back_populates='parcel', cascade='all, delete-orphan')
    applications = relationship('Application', back_populates='parcel', cascade='all, delete-orphan')
    anomalies = relationship('Anomaly', back_populates='parcel', cascade='all, delete-orphan')
    documents = relationship('Document', back_populates='parcel', cascade='all, delete-orphan')
    satellite_images = relationship('SatelliteImagery', back_populates='parcel', cascade='all, delete-orphan')
    gps_telemetries = relationship('GpsTelemetry', back_populates='parcel')

    def __repr__(self):
        return f'<Parcel {self.ulpin}>'
