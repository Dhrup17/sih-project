from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ApplicationCreate(BaseModel):
    ulpin: str
    type: str
    comments: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

class StatusHistoryOut(BaseModel):
    id: int
    status: str
    changed_by: Optional[int] = None
    changed_at: Optional[datetime] = None
    comments: Optional[str] = None
    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: int
    ulpin: str
    type: str
    applicant_id: int
    status: str
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None
    comments: Optional[str] = None
    class Config:
        from_attributes = True

class ApplicationDetail(ApplicationOut):
    status_history: List[StatusHistoryOut] = []
    applicant_name: Optional[str] = None
    parcel_survey_number: Optional[str] = None
