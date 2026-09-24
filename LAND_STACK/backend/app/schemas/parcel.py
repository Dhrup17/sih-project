from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ParcelBase(BaseModel):
    survey_number: str
    area: float
    land_use: Optional[str] = None

class ParcelCreate(ParcelBase):
    ulpin: str
    geometry: Any  # GeoJSON

class OwnershipOut(BaseModel):
    id: int
    owner_name: str
    share: float
    status: str
    class Config:
        from_attributes = True

class RegistrationOut(BaseModel):
    id: int
    registration_number: str
    registration_date: Any
    parties: Optional[Any] = None
    consideration_amount: Optional[int] = None
    class Config:
        from_attributes = True

class TaxRecordOut(BaseModel):
    id: int
    assessment_year: int
    tax_amount: float
    status: str
    due_date: Optional[Any] = None
    paid_date: Optional[Any] = None
    class Config:
        from_attributes = True

class EncumbranceOut(BaseModel):
    id: int
    type: str
    description: Optional[str] = None
    start_date: Any
    end_date: Optional[Any] = None
    status: str
    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: int
    document_type: str
    title: str
    description: Optional[str] = None
    file_path: str
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ParcelOut(ParcelBase):
    ulpin: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ParcelGeoJSON(BaseModel):
    type: str = "Feature"
    properties: dict
    geometry: dict

class ParcelProfile(ParcelOut):
    ownership_records: List[OwnershipOut] = []
    registrations: List[RegistrationOut] = []
    tax_records: List[TaxRecordOut] = []
    encumbrances: List[EncumbranceOut] = []
    documents: List[DocumentOut] = []
