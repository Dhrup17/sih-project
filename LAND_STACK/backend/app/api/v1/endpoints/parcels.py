from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import json
from app.db.session import get_db
from app.models.parcel import Parcel
from app.models.user import User
from app.schemas.parcel import ParcelOut, ParcelProfile, ParcelGeoJSON, OwnershipOut, RegistrationOut, TaxRecordOut, EncumbranceOut, DocumentOut
from app.core.deps import get_current_active_user

router = APIRouter()

def parcel_to_geojson(parcel: Parcel) -> dict:
    try:
        geom_data = json.loads(parcel.geometry) if parcel.geometry else None
        if geom_data:
            geom = geom_data
        else:
            geom = {"type": "Polygon", "coordinates": []}
    except Exception:
        geom = {"type": "Polygon", "coordinates": []}
    return {
        "type": "Feature",
        "properties": {
            "ulpin": parcel.ulpin,
            "survey_number": parcel.survey_number,
            "area": parcel.area,
            "land_use": parcel.land_use,
        },
        "geometry": geom,
    }

@router.get("/", response_model=List[ParcelOut])
def list_parcels(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    land_use: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Parcel)
    if search:
        q = q.filter(
            (Parcel.ulpin.ilike(f"%{search}%")) | (Parcel.survey_number.ilike(f"%{search}%"))
        )
    if land_use:
        q = q.filter(Parcel.land_use == land_use)
    parcels = q.offset(skip).limit(limit).all()
    return [ParcelOut.model_validate(p) for p in parcels]

@router.get("/geojson")
def get_parcels_geojson(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    parcels = db.query(Parcel).all()
    features = [parcel_to_geojson(p) for p in parcels]
    return {"type": "FeatureCollection", "features": features}

@router.get("/{ulpin}", response_model=ParcelProfile)
def get_parcel_profile(
    ulpin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    parcel = (
        db.query(Parcel)
        .options(
            joinedload(Parcel.ownership_records),
            joinedload(Parcel.registrations),
            joinedload(Parcel.tax_records),
            joinedload(Parcel.encumbrances),
            joinedload(Parcel.documents),
        )
        .filter(Parcel.ulpin == ulpin)
        .first()
    )
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return ParcelProfile(
        ulpin=parcel.ulpin,
        survey_number=parcel.survey_number,
        area=parcel.area,
        land_use=parcel.land_use,
        created_at=parcel.created_at,
        ownership_records=[OwnershipOut.model_validate(o) for o in parcel.ownership_records],
        registrations=[RegistrationOut.model_validate(r) for r in parcel.registrations],
        tax_records=[TaxRecordOut.model_validate(t) for t in parcel.tax_records],
        encumbrances=[EncumbranceOut.model_validate(e) for e in parcel.encumbrances],
        documents=[DocumentOut.model_validate(d) for d in parcel.documents],
    )

@router.get("/{ulpin}/geojson")
def get_parcel_geojson(
    ulpin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel_to_geojson(parcel)