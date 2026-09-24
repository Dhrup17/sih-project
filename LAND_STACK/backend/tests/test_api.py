import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.0.0"
    assert "spatial_features" in data


def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen1@landstack.gov.in", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "citizen1@landstack.gov.in"
    assert data["user"]["role"] == "citizen"


def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen1@landstack.gov.in", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@landstack.gov.in", "password": "password123"}
    )
    assert response.status_code == 401


def test_parcels_authenticated():
    # Login first
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "citizen1@landstack.gov.in", "password": "password123"}
    )
    token = login_resp.json()["access_token"]

    # Fetch parcels with auth
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/parcels/", headers=headers)
    assert response.status_code == 200
    parcels = response.json()
    assert len(parcels) > 0
    assert "ulpin" in parcels[0]


def test_parcels_unauthenticated():
    response = client.get("/api/v1/parcels/")
    assert response.status_code == 401


def test_ai_change_detection_service():
    from app.services.ai_monitoring import create_synthetic_satellite_pair, run_computer_vision_change_detection
    before_path, after_path = create_synthetic_satellite_pair("ULPIN-TEST-001", "Agricultural", "NewConstruction")
    res = run_computer_vision_change_detection(before_path, after_path, parcel_area_sqm=4046.86, detection_type_hint="NewConstruction")
    assert res["change_detected"] is True
    assert res["detection_type"] == "NewConstruction"
    assert "confidence_score" in res


def test_gps_navigation_service():
    from app.services.gps_navigation import generate_navigation_route, haversine_distance
    dist = haversine_distance(26.8467, 80.9462, 26.8500, 80.9500)
    assert dist > 0

    route = generate_navigation_route(26.8467, 80.9462, 26.8500, 80.9500, "Test Parcel")
    assert "total_distance_km" in route
    assert "maneuvers" in route
    assert len(route["maneuvers"]) > 0
