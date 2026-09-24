from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class GpsTelemetry(Base):
    __tablename__ = "gps_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True)
    officer_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=0.0)
    heading_degrees = Column(Float, default=0.0)
    accuracy_meters = Column(Float, default=5.0)
    status = Column(String(50), default="active_patrol")  # active_patrol, investigating, en_route, standby
    target_ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    parcel = relationship("Parcel", back_populates="gps_telemetries")
