from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from app.db.session import get_db, engine
from app.models.parcel import Parcel
from app.models.anomalies import Anomaly
from app.models.satellite_imagery import SatelliteImagery
from app.models.gps_telemetry import GpsTelemetry
from app.core.config import settings

router = APIRouter()


@router.get("/status")
def get_database_status(db: Session = Depends(get_db)):
    """Inspect database backend, PostGIS spatial capability, and table statistics."""
    db_uri = settings.SQLALCHEMY_DATABASE_URI
    is_postgres = "postgres" in db_uri.lower()
    postgis_version = None

    if is_postgres:
        try:
            res = db.execute(text("SELECT PostGIS_Version();")).fetchone()
            postgis_version = res[0] if res else "Enabled"
        except Exception:
            postgis_version = "PostGIS extension not active or uninitialized"

    parcel_count = db.query(Parcel).count()
    anomaly_count = db.query(Anomaly).count()
    imagery_count = db.query(SatelliteImagery).count()
    gps_count = db.query(GpsTelemetry).count()

    return {
        "engine": "PostgreSQL + PostGIS" if is_postgres else "SQLite Spatial (WGS84 SRID 4326 GeoJSON)",
        "connection_uri_type": "PostgreSQL" if is_postgres else "SQLite",
        "postgis_status": postgis_version if is_postgres else "PostGIS Ready Schema & DDL available at database/init_postgis.sql",
        "srid": 4326,
        "metrics": {
            "total_parcels": parcel_count,
            "anomalies_logged": anomaly_count,
            "satellite_scenes": imagery_count,
            "gps_telemetry_records": gps_count,
        },
        "spatial_features_enabled": [
            "Centroid Calculation",
            "Point-in-Polygon Geofencing",
            "Radius Proximity Query",
            "Satellite Change Detection",
            "Live GPS Real-Time Streaming"
        ]
    }


@router.post("/query-spatial")
def test_spatial_query(
    lon: float = 80.9462,
    lat: float = 26.8467,
    radius_km: float = 2.0,
    db: Session = Depends(get_db)
):
    """Execute spatial proximity query around a coordinate."""
    from app.services.gps_navigation import haversine_distance

    parcels = db.query(Parcel).all()
    results = []
    for p in parcels:
        try:
            geom = json.loads(p.geometry)
            coords = geom["coordinates"][0]
            c_lon = sum(c[0] for c in coords) / len(coords)
            c_lat = sum(c[1] for c in coords) / len(coords)
            dist_m = haversine_distance(lat, lon, c_lat, c_lon)
            if dist_m <= (radius_km * 1000):
                results.append({
                    "ulpin": p.ulpin,
                    "survey_number": p.survey_number,
                    "land_use": p.land_use,
                    "area_sqm": p.area,
                    "distance_meters": round(dist_m, 1),
                    "center": [round(c_lon, 6), round(c_lat, 6)]
                })
        except Exception:
            continue

    results.sort(key=lambda x: x["distance_meters"])
    return {
        "center_point": [lon, lat],
        "radius_km": radius_km,
        "parcels_found": len(results),
        "parcels": results
    }
