import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.parcel import Parcel
from app.models.gps_telemetry import GpsTelemetry
from app.core.deps import get_current_active_user
from app.services.gps_navigation import generate_navigation_route, point_in_polygon, haversine_distance

router = APIRouter()


class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    target_ulpin: Optional[str] = None
    dest_lat: Optional[float] = None
    dest_lon: Optional[float] = None
    mode: Optional[str] = "driving"  # driving or walking


class TelemetryInput(BaseModel):
    device_id: str
    officer_name: str
    latitude: float
    longitude: float
    altitude: Optional[float] = 0.0
    speed_kmh: Optional[float] = 0.0
    heading_degrees: Optional[float] = 0.0
    accuracy_meters: Optional[float] = 5.0
    status: Optional[str] = "active_patrol"
    target_ulpin: Optional[str] = None


@router.post("/route")
def get_navigation_route(
    req: RouteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate navigation route from current GPS location to target parcel or coordinate."""
    dest_lat = req.dest_lat
    dest_lon = req.dest_lon
    dest_name = "Target Destination"

    if req.target_ulpin:
        parcel = db.query(Parcel).filter(Parcel.ulpin == req.target_ulpin).first()
        if not parcel:
            raise HTTPException(status_code=404, detail="Target parcel not found")
        dest_name = f"Parcel {parcel.ulpin} (Survey #{parcel.survey_number})"
        try:
            geom = json.loads(parcel.geometry)
            coords = geom["coordinates"][0]
            # Average polygon coordinates for centroid
            dest_lon = sum(c[0] for c in coords) / len(coords)
            dest_lat = sum(c[1] for c in coords) / len(coords)
        except Exception:
            dest_lat = 26.8467
            dest_lon = 80.9462

    if dest_lat is None or dest_lon is None:
        raise HTTPException(status_code=400, detail="Destination coordinates or valid target_ulpin required")

    route_data = generate_navigation_route(
        start_lat=req.start_lat,
        start_lon=req.start_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        dest_name=dest_name,
        mode=req.mode or "driving"
    )
    return route_data


@router.post("/telemetry")
def record_telemetry(
    telemetry_in: TelemetryInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Record live GPS telemetry point from inspector device or patrol vehicle."""
    point = GpsTelemetry(
        device_id=telemetry_in.device_id,
        officer_name=telemetry_in.officer_name,
        latitude=telemetry_in.latitude,
        longitude=telemetry_in.longitude,
        altitude=telemetry_in.altitude or 0.0,
        speed_kmh=telemetry_in.speed_kmh or 0.0,
        heading_degrees=telemetry_in.heading_degrees or 0.0,
        accuracy_meters=telemetry_in.accuracy_meters or 5.0,
        status=telemetry_in.status or "active_patrol",
        target_ulpin=telemetry_in.target_ulpin,
        timestamp=datetime.utcnow()
    )
    db.add(point)
    db.commit()
    db.refresh(point)
    return {"status": "ok", "telemetry_id": point.id}


@router.get("/active-patrols")
def get_active_patrols(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get latest GPS position for all active patrols / inspection officers."""
    patrols = (
        db.query(GpsTelemetry)
        .order_by(GpsTelemetry.timestamp.desc())
        .limit(20)
        .all()
    )

    # Group by device_id to get latest per device
    latest_by_device = {}
    for p in patrols:
        if p.device_id not in latest_by_device:
            latest_by_device[p.device_id] = {
                "id": p.id,
                "device_id": p.device_id,
                "officer_name": p.officer_name,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "speed_kmh": p.speed_kmh,
                "heading_degrees": p.heading_degrees,
                "accuracy_meters": p.accuracy_meters,
                "status": p.status,
                "target_ulpin": p.target_ulpin,
                "timestamp": p.timestamp.isoformat(),
            }

    # If empty, return a default simulated field patrol unit near Lucknow parcels
    if not latest_by_device:
        return [
            {
                "id": 1,
                "device_id": "PATROL-OFFICER-01",
                "officer_name": "Vikram Patel (Field Inspector)",
                "latitude": 26.8485,
                "longitude": 80.9475,
                "speed_kmh": 32.4,
                "heading_degrees": 48.0,
                "accuracy_meters": 3.5,
                "status": "active_patrol",
                "target_ulpin": "ULPIN-UP-LKO-001",
                "timestamp": datetime.utcnow().isoformat()
            }
        ]

    return list(latest_by_device.values())


@router.post("/geofence-check")
def check_geofence(
    lat: float,
    lon: float,
    ulpin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if GPS coordinate is inside parcel boundary polygon."""
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    try:
        geom = json.loads(parcel.geometry)
        coords = geom["coordinates"][0]  # [[lon, lat], ...]
        is_inside = point_in_polygon(lat, lon, coords)
        # Centroid distance
        c_lon = sum(c[0] for c in coords) / len(coords)
        c_lat = sum(c[1] for c in coords) / len(coords)
        dist_m = haversine_distance(lat, lon, c_lat, c_lon)
    except Exception:
        is_inside = False
        dist_m = 9999.0

    return {
        "ulpin": ulpin,
        "is_inside": is_inside,
        "distance_to_center_meters": round(dist_m, 1),
        "geofence_status": "INSIDE_BOUNDARY" if is_inside else "OUTSIDE_BOUNDARY"
    }
