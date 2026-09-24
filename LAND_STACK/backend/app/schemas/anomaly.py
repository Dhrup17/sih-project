from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnomalyCreate(BaseModel):
    ulpin: str
    detection_type: str
    description: str
    confidence_score: float
    affected_area_sqm: Optional[float] = 0.0
    change_percentage: Optional[float] = 0.0
    image_before_path: Optional[str] = None
    image_after_path: Optional[str] = None
    diff_heatmap_path: Optional[str] = None


class AnomalyStatusUpdate(BaseModel):
    status: str


class AnomalyOut(BaseModel):
    id: int
    ulpin: str
    detection_type: str
    description: str
    confidence_score: float
    affected_area_sqm: Optional[float] = 0.0
    change_percentage: Optional[float] = 0.0
    detected_at: Optional[datetime] = None
    status: str
    image_before_path: Optional[str] = None
    image_after_path: Optional[str] = None
    diff_heatmap_path: Optional[str] = None
    detected_by_system: str

    class Config:
        from_attributes = True
