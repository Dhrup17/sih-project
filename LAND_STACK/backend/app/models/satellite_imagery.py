from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class SatelliteImagery(Base):
    __tablename__ = "satellite_imagery"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    scene_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    sensor_name = Column(String(100), nullable=False, default="Sentinel-2 MSI")
    resolution_meters = Column(Float, nullable=False, default=10.0)
    cloud_coverage = Column(Float, default=0.0)
    image_path = Column(String(500), nullable=False)
    image_type = Column(String(50), nullable=False, default="baseline")  # baseline, acquisition, drone_ortho
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("Parcel", back_populates="satellite_images")
