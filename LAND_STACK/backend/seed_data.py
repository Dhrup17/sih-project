import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, date, timedelta, timezone
import random
import json
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
from app.core.security import get_password_hash

def create_polygon_geojson(center_lat, center_lon, size=0.001):
    """Create a simple square polygon GeoJSON around a center point"""
    half = size / 2
    coords = [
        [center_lon - half, center_lat - half],
        [center_lon + half, center_lat - half],
        [center_lon + half, center_lat + half],
        [center_lon - half, center_lat + half],
        [center_lon - half, center_lat - half],
    ]
    return json.dumps({
        "type": "Polygon",
        "coordinates": [coords]
    })

def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ==================== USERS ====================
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
        
        # ==================== PARCELS ====================
        # Near Lucknow, UP (26.8467° N, 80.9462° E)
        base_lat, base_lon = 26.8467, 80.9462
        parcels_data = [
            {"ulpin": "ULPIN-UP-LKO-001", "survey": "LKO/2024/001", "area": 4046.86, "use": "Agricultural", "offset": (0, 0)},
            {"ulpin": "ULPIN-UP-LKO-002", "survey": "LKO/2024/002", "area": 2023.43, "use": "Residential", "offset": (0.003, 0)},
            {"ulpin": "ULPIN-UP-LKO-003", "survey": "LKO/2024/003", "area": 8093.71, "use": "Commercial", "offset": (0.006, 0)},
            {"ulpin": "ULPIN-UP-LKO-004", "survey": "LKO/2024/004", "area": 1214.06, "use": "Agricultural", "offset": (0.009, 0)},
            {"ulpin": "ULPIN-UP-LKO-005", "survey": "LKO/2024/005", "area": 6070.28, "use": "Residential", "offset": (0, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-006", "survey": "LKO/2024/006", "area": 3035.14, "use": "Industrial", "offset": (0.003, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-007", "survey": "LKO/2024/007", "area": 5059.48, "use": "Commercial", "offset": (0.006, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-008", "survey": "LKO/2024/008", "area": 2428.11, "use": "Residential", "offset": (0.009, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-009", "survey": "LKO/2024/009", "area": 10117.14, "use": "Agricultural", "offset": (0, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-010", "survey": "LKO/2024/010", "area": 1618.74, "use": "Residential", "offset": (0.003, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-011", "survey": "LKO/2024/011", "area": 4856.23, "use": "Agricultural", "offset": (0.006, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-012", "survey": "LKO/2024/012", "area": 3237.49, "use": "Commercial", "offset": (0.009, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-013", "survey": "LKO/2024/013", "area": 7284.35, "use": "Agricultural", "offset": (0, 0.009)},
            {"ulpin": "ULPIN-UP-LKO-014", "survey": "LKO/2024/014", "area": 1821.12, "use": "Residential", "offset": (0.003, 0.009)},
            {"ulpin": "ULPIN-UP-LKO-015", "survey": "LKO/2024/015", "area": 9712.57, "use": "Industrial", "offset": (0.006, 0.009)},
            {"ulpin": "ULPIN-UP-LKO-016", "survey": "LKO/2024/016", "area": 2630.80, "use": "Agricultural", "offset": (0.009, 0.009)},
            {"ulpin": "ULPIN-UP-LKO-017", "survey": "LKO/2024/017", "area": 5463.71, "use": "Residential", "offset": (0.012, 0)},
            {"ulpin": "ULPIN-UP-LKO-018", "survey": "LKO/2024/018", "area": 3844.52, "use": "Commercial", "offset": (0.012, 0.003)},
            {"ulpin": "ULPIN-UP-LKO-019", "survey": "LKO/2024/019", "area": 6677.14, "use": "Agricultural", "offset": (0.012, 0.006)},
            {"ulpin": "ULPIN-UP-LKO-020", "survey": "LKO/2024/020", "area": 2024.28, "use": "Residential", "offset": (0.012, 0.009)},
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
        
        # ==================== OWNERSHIP ====================
        owner_names = ["Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sunita Devi", "Mohan Lal", "Ram Prasad", "Geeta Rani", "Vijay Mishra"]
        for p in parcels:
            num_owners = random.choice([1, 1, 1, 2])
            if num_owners == 1:
                db.add(OwnershipROR(parcel_ulpin=p.ulpin, owner_name=random.choice(owner_names), share=100.0, status="approved"))
            else:
                share1 = random.choice([50, 60, 70])
                db.add(OwnershipROR(parcel_ulpin=p.ulpin, owner_name=random.choice(owner_names), share=float(share1), status="approved"))
                db.add(OwnershipROR(parcel_ulpin=p.ulpin, owner_name=random.choice(owner_names), share=float(100 - share1), status="approved"))
        db.commit()
        
        # ==================== REGISTRATIONS ====================
        for i, p in enumerate(parcels[:12]):
            db.add(Registration(
                parcel_ulpin=p.ulpin,
                registration_number=f"REG-2024-{i+1:04d}",
                registration_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
                parties=json.dumps({"buyer": random.choice(owner_names), "seller": random.choice(owner_names)}),
                consideration_amount=random.randint(500000, 5000000),
                registered_by=users[4].id,
            ))
        db.commit()
        
        # ==================== TAX RECORDS ====================
        statuses = ["Paid", "Paid", "Paid", "Pending", "Overdue"]
        for p in parcels:
            for year in [2023, 2024]:
                tax_status = random.choice(statuses)
                db.add(TaxRecord(
                    parcel_ulpin=p.ulpin,
                    assessment_year=year,
                    tax_amount=round(random.uniform(1000, 50000), 2),
                    status=tax_status,
                    due_date=date(year, 3, 31),
                    paid_date=date(year, random.randint(1, 3), random.randint(1, 28)) if tax_status == "Paid" else None,
                ))
        db.commit()
        
        # ==================== ENCUMBRANCES ====================
        enc_types = ["Mortgage", "CourtStay", "TaxLien", "Easement"]
        for p in parcels[:6]:
            db.add(Encumbrance(
                parcel_ulpin=p.ulpin,
                type=random.choice(enc_types),
                description=f"Encumbrance on parcel {p.ulpin}",
                start_date=date(2023, random.randint(1, 12), 1),
                end_date=date(2025, random.randint(1, 12), 1) if random.random() > 0.3 else None,
                status=random.choice(["Active", "Active", "Cleared"]),
            ))
        db.commit()
        
        # ==================== APPLICATIONS ====================
        app_types = ["OwnershipTransfer", "LandUseChange", "Mutation", "NewConstructionPermission", "Dispute"]
        app_statuses = ["Submitted", "UnderReview", "Approved", "Rejected", "Submitted"]
        citizen_users = [u for u in users if u.role == UserRole.CITIZEN]
        
        applications = []
        for i in range(15):
            p = random.choice(parcels)
            citizen = random.choice(citizen_users)
            status = app_statuses[i % len(app_statuses)]
            app = Application(
                ulpin=p.ulpin,
                type=app_types[i % len(app_types)],
                applicant_id=citizen.id,
                status=status,
                submitted_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
                comments=f"Application for {app_types[i % len(app_types)]} on parcel {p.ulpin}",
            )
            if status in ("Approved", "Rejected"):
                app.decided_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
                app.decided_by = users[4].id
            db.add(app)
            applications.append(app)
        db.commit()
        
        for app in applications:
            db.refresh(app)
        
        # ==================== APPLICATION STATUS HISTORY ====================
        for app in applications:
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                status="Submitted",
                changed_by=app.applicant_id,
                changed_at=app.submitted_at,
                comments="Application submitted",
            ))
            if app.status in ("UnderReview", "Approved", "Rejected"):
                db.add(ApplicationStatusHistory(
                    application_id=app.id,
                    status="UnderReview",
                    changed_by=users[4].id,
                    changed_at=app.submitted_at + timedelta(days=2),
                    comments="Application under review by officer",
                ))
            if app.status in ("Approved", "Rejected"):
                db.add(ApplicationStatusHistory(
                    application_id=app.id,
                    status=app.status,
                    changed_by=users[4].id,
                    changed_at=app.decided_at,
                    comments=f"Application {app.status.lower()} by officer",
                ))
        db.commit()
        
        # ==================== ANOMALIES ====================
        anomaly_data = [
            {"ulpin": "ULPIN-UP-LKO-001", "type": "NewConstruction", "desc": "Structure built on agricultural-zoned land. Satellite imagery shows new building footprint.", "score": 0.92},
            {"ulpin": "ULPIN-UP-LKO-003", "type": "LandUseChange", "desc": "Commercial activity detected in residential zone. Parking lot and signage visible.", "score": 0.87},
            {"ulpin": "ULPIN-UP-LKO-009", "type": "Encroachment", "desc": "Boundary encroachment detected. Structure extends 2m beyond registered boundary.", "score": 0.78},
            {"ulpin": "ULPIN-UP-LKO-005", "type": "Deforestation", "desc": "Significant tree cover loss detected. 40% vegetation reduction in last quarter.", "score": 0.85},
            {"ulpin": "ULPIN-UP-LKO-013", "type": "NewConstruction", "desc": "Unauthorized construction detected on agricultural parcel. Multi-story structure visible.", "score": 0.94},
        ]
        for ad in anomaly_data:
            db.add(Anomaly(
                ulpin=ad["ulpin"],
                detection_type=ad["type"],
                description=ad["desc"],
                confidence_score=ad["score"],
                status=random.choice(["New", "New", "UnderInvestigation"]),
            ))
        db.commit()
        
        # ==================== DOCUMENTS ====================
        doc_types = ["SaleDeed", "MutationOrder", "NOC", "TaxReceipt", "SurveyReport"]
        for i, p in enumerate(parcels[:10]):
            db.add(Document(
                parcel_ulpin=p.ulpin,
                document_type=doc_types[i % len(doc_types)],
                title=f"{doc_types[i % len(doc_types)]} for {p.survey_number}",
                description=f"Official document for parcel {p.ulpin}",
                file_path=f"/documents/{p.ulpin}/{doc_types[i % len(doc_types)].lower()}.pdf",
                uploaded_by=users[4].id,
            ))
        db.commit()
        
        print("[SUCCESS] Seed data created successfully!")
        print(f"  * Users: {len(users_data)}")
        print(f"  * Parcels: {len(parcels_data)}")
        print(f"  * Applications: 15")
        print(f"  * Anomalies: {len(anomaly_data)}")
        print("\nDatabase: landstack.db (SQLite)")
        print("\nYou can now run: uvicorn app.main:app --reload")

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
