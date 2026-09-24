from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    ulpin = Column(String, ForeignKey("parcels.ulpin", ondelete="CASCADE"), nullable=False, index=True)
    detection_type = Column(String, nullable=False)  # LandUseChange, NewConstruction, Encroachment, Deforestation
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    affected_area_sqm = Column(Float, default=0.0)  # in m2
    change_percentage = Column(Float, default=0.0)  # percentage of parcel changed
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="New", nullable=False)  # New, UnderInvestigation, Resolved, FalsePositive
    image_before_path = Column(String, nullable=True)
    image_after_path = Column(String, nullable=True)
    diff_heatmap_path = Column(String, nullable=True)
    coordinates_json = Column(Text, nullable=True)  # JSON representation of bounding box or contour
    detected_by_system = Column(String, default="AI_Vision_Engine_v2", nullable=False)

    parcel = relationship("Parcel", back_populates="anomalies")