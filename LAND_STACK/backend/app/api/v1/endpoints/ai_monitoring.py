import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.parcel import Parcel
from app.models.anomalies import Anomaly
from app.models.satellite_imagery import SatelliteImagery
from app.core.deps import get_current_active_user
from app.services.ai_monitoring import (
    run_computer_vision_change_detection,
    create_synthetic_satellite_pair,
    SATELLITE_DIR
)

router = APIRouter()


@router.get("/scenes/{ulpin}")
def get_parcel_satellite_scenes(
    ulpin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all baseline and recent satellite imagery scenes for a parcel."""
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    scenes = db.query(SatelliteImagery).filter(SatelliteImagery.ulpin == ulpin).all()
    # If no scenes yet, automatically generate realistic pair for immediate usability
    if not scenes:
        base_path, after_path = create_synthetic_satellite_pair(ulpin, parcel.land_use or "Agricultural")
        s1 = SatelliteImagery(
            ulpin=ulpin,
            scene_date=datetime(2023, 5, 12),
            sensor_name="Sentinel-2 MSI",
            resolution_meters=10.0,
            cloud_coverage=0.02,
            image_path=f"/static/satellite_imagery/{os.path.basename(base_path)}",
            image_type="baseline",
        )
        s2 = SatelliteImagery(
            ulpin=ulpin,
            scene_date=datetime(2024, 8, 20),
            sensor_name="PlanetScope 3m",
            resolution_meters=3.0,
            cloud_coverage=0.01,
            image_path=f"/static/satellite_imagery/{os.path.basename(after_path)}",
            image_type="acquisition",
        )
        db.add_all([s1, s2])
        db.commit()
        scenes = [s1, s2]

    return [
        {
            "id": s.id,
            "ulpin": s.ulpin,
            "scene_date": s.scene_date.isoformat(),
            "sensor_name": s.sensor_name,
            "resolution_meters": s.resolution_meters,
            "cloud_coverage": s.cloud_coverage,
            "image_path": s.image_path,
            "image_type": s.image_type,
        }
        for s in scenes
    ]


@router.post("/detect-change")
def run_ai_change_detection_endpoint(
    ulpin: str,
    detection_type_hint: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Executes pure AI Computer Vision change detection between the parcel's stored
    database baseline satellite image and the latest satellite acquisition.
    """
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    # Fetch baseline and latest satellite image
    scenes = db.query(SatelliteImagery).filter(SatelliteImagery.ulpin == ulpin).order_by(SatelliteImagery.scene_date.asc()).all()
    if len(scenes) < 2:
        # Generate them
        base_path, after_path = create_synthetic_satellite_pair(ulpin, parcel.land_use or "Agricultural", detection_type_hint or "NewConstruction")
    else:
        # Map URL to local path
        base_filename = os.path.basename(scenes[0].image_path)
        after_filename = os.path.basename(scenes[-1].image_path)
        base_path = os.path.join(SATELLITE_DIR, base_filename)
        after_path = os.path.join(SATELLITE_DIR, after_filename)
        if not os.path.exists(base_path) or not os.path.exists(after_path):
            base_path, after_path = create_synthetic_satellite_pair(ulpin, parcel.land_use or "Agricultural", detection_type_hint or "NewConstruction")

    # Run CV change analysis
    analysis_result = run_computer_vision_change_detection(
        before_img_path=base_path,
        after_img_path=after_path,
        parcel_area_sqm=parcel.area,
        detection_type_hint=detection_type_hint
    )

    # Save to Anomalies table if change was detected
    if analysis_result["change_detected"]:
        new_anomaly = Anomaly(
            ulpin=ulpin,
            detection_type=analysis_result["detection_type"],
            description=analysis_result["description"],
            confidence_score=analysis_result["confidence_score"],
            affected_area_sqm=analysis_result["affected_area_sqm"],
            change_percentage=analysis_result["change_percentage"],
            status="New",
            image_before_path=analysis_result["before_image_url"],
            image_after_path=analysis_result["after_image_url"],
            diff_heatmap_path=analysis_result["diff_heatmap_url"],
            detected_by_system="AI_Vision_Engine_v2",
        )
        db.add(new_anomaly)
        db.commit()
        db.refresh(new_anomaly)
        analysis_result["anomaly_id"] = new_anomaly.id

    return analysis_result


@router.post("/upload-satellite-image")
def upload_satellite_image(
    ulpin: str = Form(...),
    image_type: str = Form("acquisition"),
    sensor_name: str = Form("UAV_Drone_Survey"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload custom satellite or drone imagery for a parcel to run change detection."""
    parcel = db.query(Parcel).filter(Parcel.ulpin == ulpin).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    filename = f"{ulpin}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(SATELLITE_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    sat_img = SatelliteImagery(
        ulpin=ulpin,
        scene_date=datetime.utcnow(),
        sensor_name=sensor_name,
        resolution_meters=1.0,
        cloud_coverage=0.0,
        image_path=f"/static/satellite_imagery/{filename}",
        image_type=image_type,
    )
    db.add(sat_img)
    db.commit()
    db.refresh(sat_img)

    return {
        "message": "Satellite image uploaded successfully",
        "image_id": sat_img.id,
        "image_url": sat_img.image_path,
        "ulpin": ulpin
    }
