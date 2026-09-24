import sys
import os
import json
import random
from datetime import datetime, date, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.parcel import Parcel
from app.models.ownership_ror import OwnershipROR
from app.models.registrations import Registration
from app.models.tax_records import TaxRecord
from app.models.encumbrances import Encumbrance
from app.models.applications import Application
from app.models.application_status_history import ApplicationStatusHistory
from app.models.anomalies import Anomaly
from app.models.documents import Document
from app.models.satellite_imagery import SatelliteImagery
from app.models.gps_telemetry import GpsTelemetry
from app.core.security import get_password_hash
from app.services.ai_monitoring import create_synthetic_satellite_pair, run_computer_vision_change_detection


def create_polygon_geojson(center_lat: float, center_lon: float, size: float = 0.002) -> str:
    """Create a polygon GeoJSON around a center point in WGS84 coordinates."""
    half = size / 2.0
    coords = [
        [round(center_lon - half, 6), round(center_lat - half, 6)],
        [round(center_lon + half, 6), round(center_lat - half, 6)],
        [round(center_lon + half, 6), round(center_lat + half, 6)],
        [round(center_lon - half, 6), round(center_lat + half, 6)],
        [round(center_lon - half, 6), round(center_lat - half, 6)],
    ]
    return json.dumps({
        "type": "Polygon",
        "coordinates": [coords]
    })


def import_and_seed_database():
    print("==========================================================")
    print("LAND STACK - Digital Land Governance Spatial Database Import")
    print("==========================================================")

    # 1. Initialize Tables
    print("1. Re-creating all spatial & entity database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("   [OK] All tables created successfully.")

    db = SessionLocal()

    try:
        # 2. Users (Citizens, Officers, Admins)
        print("2. Importing users and assigning RBAC credentials...")
        users_data = [
            {"name": "Rajesh Kumar", "email": "citizen1@landstack.gov.in", "role": UserRole.CITIZEN},
            {"name": "Priya Sharma", "email": "citizen2@landstack.gov.in", "role": UserRole.CITIZEN},
            {"name": "Amit Singh", "email": "citizen3@landstack.gov.in", "role": UserRole.CITIZEN},
            {"name": "Sunita Devi", "email": "citizen4@landstack.gov.in", "role": UserRole.CITIZEN},
            {"name": "Vikram Patel", "email": "officer1@landstack.gov.in", "role": UserRole.OFFICER},
            {"name": "Anita Verma", "email": "officer2@landstack.gov.in", "role": UserRole.OFFICER},
            {"name": "Suresh Yadav", "email": "officer3@landstack.gov.in", "role": UserRole.OFFICER},
            {"name": "Admin User", "email": "admin@landstack.gov.in", "role": UserRole.ADMIN},
            {"name": "System Admin", "email": "sysadmin@landstack.gov.in", "role": UserRole.ADMIN},
            {"name": "Deepak Gupta", "email": "admin2@landstack.gov.in", "role": UserRole.ADMIN},
        ]
        
        password_hash = get_password_hash("password123")
        users = []
        for ud in users_data:
            u = User(name=ud["name"], email=ud["email"], password_hash=password_hash, role=ud["role"])
            db.add(u)
            users.append(u)
        db.commit()
        for u in users:
            db.refresh(u)
        print(f"   [OK] {len(users)} users imported (Password: 'password123').")

        # 3. Parcels (Spatial boundaries in Lucknow, UP)
        print("3. Importing cadastral land parcels with PostGIS geometries...")
        base_lat, base_lon = 26.8467, 80.9462
        parcels_data = [
            {"ulpin": "ULPIN-UP-LKO-001", "survey": "LKO/2024/001", "area": 4046.86, "use": "Agricultural", "offset": (0.000, 0.000)},
            {"ulpin": "ULPIN-UP-LKO-002", "survey": "LKO/2024/002", "area": 2023.43, "use": "Residential", "offset": (0.003, 0.001)},
            {"ulpin": "ULPIN-UP-LKO-003", "survey": "LKO/2024/003", "area": 8093.71, "use": "Commercial", "offset": (0.006, -0.002)},
            {"ulpin": "ULPIN-UP-LKO-004", "survey": "LKO/2024/004", "area": 1214.06, "use": "Agricultural", "offset": (0.009, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-005", "survey": "LKO/2024/005", "area": 6070.28, "use": "Forest", "offset": (-0.003, 0.004)},
            {"ulpin": "ULPIN-UP-LKO-006", "survey": "LKO/2024/006", "area": 3035.14, "use": "Industrial", "offset": (0.003, 0.005)},
            {"ulpin": "ULPIN-UP-LKO-007", "survey": "LKO/2024/007", "area": 5059.48, "use": "Commercial", "offset": (0.006, 0.004)},
            {"ulpin": "ULPIN-UP-LKO-008", "survey": "LKO/2024/008", "area": 2428.11, "use": "Residential", "offset": (0.009, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-009", "survey": "LKO/2024/009", "area": 10117.14, "use": "Agricultural", "offset": (-0.005, -0.003)},
            {"ulpin": "ULPIN-UP-LKO-010", "survey": "LKO/2024/010", "area": 1618.74, "use": "Residential", "offset": (0.004, -0.004)},
            {"ulpin": "ULPIN-UP-LKO-011", "survey": "LKO/2024/011", "area": 4856.23, "use": "Agricultural", "offset": (0.007, -0.005)},
            {"ulpin": "ULPIN-UP-LKO-012", "survey": "LKO/2024/012", "area": 3237.49, "use": "Commercial", "offset": (0.010, -0.002)},
        ]

        parcels = []
        for pd in parcels_data:
            lat = base_lat + pd["offset"][0]
            lon = base_lon + pd["offset"][1]
            geom = create_polygon_geojson(lat, lon, size=0.002)
            p = Parcel(
                ulpin=pd["ulpin"],
                survey_number=pd["survey"],
                area=pd["area"],
                geometry=geom,
                land_use=pd["use"],
            )
            db.add(p)
            parcels.append(p)
        db.commit()
        print(f"   [OK] {len(parcels)} cadastral parcels imported with WGS84 geometries.")

        # 4. Satellite Imagery & AI Anomaly Detection Pipeline
        print("4. Generating satellite imagery scenes and executing AI change detection...")
        anomaly_configs = [
            ("ULPIN-UP-LKO-001", "NewConstruction"),
            ("ULPIN-UP-LKO-003", "LandUseChange"),
            ("ULPIN-UP-LKO-005", "Deforestation"),
            ("ULPIN-UP-LKO-009", "Encroachment"),
        ]

        for p in parcels:
            # Check if this parcel has configured anomaly
            anomaly_cfg = next((cfg for cfg in anomaly_configs if cfg[0] == p.ulpin), None)
            anomaly_type = anomaly_cfg[1] if anomaly_cfg else "NewConstruction"

            base_file, after_file = create_synthetic_satellite_pair(p.ulpin, p.land_use, anomaly_type)
            
            s_base = SatelliteImagery(
                ulpin=p.ulpin,
                scene_date=datetime(2023, 4, 15),
                sensor_name="Sentinel-2 MSI",
                resolution_meters=10.0,
                cloud_coverage=0.01,
                image_path=f"/static/satellite_imagery/{os.path.basename(base_file)}",
                image_type="baseline",
            )
            s_latest = SatelliteImagery(
                ulpin=p.ulpin,
                scene_date=datetime(2024, 9, 1),
                sensor_name="PlanetScope 3m",
                resolution_meters=3.0,
                cloud_coverage=0.00,
                image_path=f"/static/satellite_imagery/{os.path.basename(after_file)}",
                image_type="acquisition",
            )
            db.add_all([s_base, s_latest])

            # If parcel is in anomaly list, execute real AI CV change detection
            if anomaly_cfg:
                cv_result = run_computer_vision_change_detection(
                    base_file,
                    after_file,
                    parcel_area_sqm=p.area,
                    detection_type_hint=anomaly_type
                )
                db.add(Anomaly(
                    ulpin=p.ulpin,
                    detection_type=cv_result["detection_type"],
                    description=cv_result["description"],
                    confidence_score=cv_result["confidence_score"],
                    affected_area_sqm=cv_result["affected_area_sqm"],
                    change_percentage=cv_result["change_percentage"],
                    status="New",
                    image_before_path=cv_result["before_image_url"],
                    image_after_path=cv_result["after_image_url"],
                    diff_heatmap_path=cv_result["diff_heatmap_url"],
                    detected_by_system="AI_Vision_Engine_v2",
                ))

        db.commit()
        print("   [OK] Satellite imagery repository & AI change detection heatmaps generated.")

        # 5. GPS Telemetry & Patrol Tracking
        print("5. Initializing real-time field officer GPS telemetry tracks...")
        gps_data = [
            {
                "device_id": "PATROL-OFFICER-01",
                "officer_name": "Vikram Patel (Field Inspector)",
                "latitude": 26.8475,
                "longitude": 80.9468,
                "altitude": 125.0,
                "speed_kmh": 34.2,
                "heading_degrees": 55.0,
                "accuracy_meters": 3.0,
                "status": "active_patrol",
                "target_ulpin": "ULPIN-UP-LKO-001",
            },
            {
                "device_id": "DRONE-SURVEY-02",
                "officer_name": "Anita Verma (Aerial Survey)",
                "latitude": 26.8520,
                "longitude": 80.9490,
                "altitude": 195.0,
                "speed_kmh": 45.0,
                "heading_degrees": 120.0,
                "accuracy_meters": 1.2,
                "status": "investigating",
                "target_ulpin": "ULPIN-UP-LKO-003",
            }
        ]
        for gd in gps_data:
            db.add(GpsTelemetry(
                device_id=gd["device_id"],
                officer_name=gd["officer_name"],
                latitude=gd["latitude"],
                longitude=gd["longitude"],
                altitude=gd["altitude"],
                speed_kmh=gd["speed_kmh"],
                heading_degrees=gd["heading_degrees"],
                accuracy_meters=gd["accuracy_meters"],
                status=gd["status"],
                target_ulpin=gd["target_ulpin"],
            ))
        db.commit()
        print("   [OK] Active field patrol telemetry imported.")

        # 6. Ownership Records
        owner_names = ["Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sunita Devi", "Mohan Lal", "Ram Prasad"]
        for p in parcels:
            db.add(OwnershipROR(parcel_ulpin=p.ulpin, owner_name=random.choice(owner_names), share=100.0, status="approved"))
        db.commit()

        # 7. Registrations, Taxes, Encumbrances
        for i, p in enumerate(parcels[:6]):
            db.add(Registration(
                parcel_ulpin=p.ulpin,
                registration_number=f"REG-2024-{i+1:04d}",
                registration_date=date(2024, 2, 14),
                parties=json.dumps({"buyer": random.choice(owner_names), "seller": "UP Land Authority"}),
                consideration_amount=2500000.0,
                registered_by=users[4].id,
            ))
            db.add(TaxRecord(
                parcel_ulpin=p.ulpin,
                assessment_year=2024,
                tax_amount=12500.0,
                status="Paid" if i % 2 == 0 else "Pending",
                due_date=date(2024, 3, 31),
                paid_date=date(2024, 3, 10) if i % 2 == 0 else None,
            ))
        db.commit()

        # 8. Applications
        app_types = ["OwnershipTransfer", "LandUseChange", "Mutation", "NewConstructionPermission"]
        for i, p in enumerate(parcels[:8]):
            app = Application(
                ulpin=p.ulpin,
                type=app_types[i % len(app_types)],
                applicant_id=users[i % 4].id,
                status="Submitted" if i % 2 == 0 else "UnderReview",
                comments=f"Application for {app_types[i % len(app_types)]} on parcel {p.ulpin}",
            )
            db.add(app)
            db.commit()
            db.refresh(app)
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                status="Submitted",
                changed_by=app.applicant_id,
                comments="Application submitted via Citizen Portal",
            ))
        db.commit()

        print("==========================================================")
        print("DATABASE IMPORT COMPLETE!")
        print(f"  - Total Parcels: {len(parcels)}")
        print(f"  - AI Anomalies: {len(anomaly_configs)}")
        print(f"  - Satellite Imagery Scenes: {len(parcels) * 2}")
        print(f"  - Active GPS Patrols: {len(gps_data)}")
        print("==========================================================")

    except Exception as e:
        print(f"Error during import: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    import_and_seed_database()
