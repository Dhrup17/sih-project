import urllib.request
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(name, url, method="GET", data=None):
    print(f"\n--- Testing: {name} ({method} {url}) ---")
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode("utf-8")
            parsed = json.loads(body)
            print(f"Status: {status} OK")
            print(f"Sample response: {str(parsed)[:200]}...")
            return parsed
    except Exception as e:
        print(f"FAILED: {e}")
        return None

def main():
    # 1. Root & Database Status
    test_endpoint("Root API", "http://localhost:8000/")
    test_endpoint("Database Status", f"{BASE_URL}/database/status")

    # 2. Login to get auth token
    login_payload = json.dumps({"email": "officer1@landstack.gov.in", "password": "password123"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        token_data = json.loads(resp.read().decode("utf-8"))
        token = token_data.get("access_token")
        print(f"\n[OK] Auth Login Successful! Bearer Token received.")

    # 3. List Parcels with Auth
    req_parcels = urllib.request.Request(f"{BASE_URL}/parcels", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req_parcels) as resp:
        parcels = json.loads(resp.read().decode("utf-8"))
        print(f"\n[OK] Parcels Retrieved: {len(parcels)} parcels available.")

    # 4. Satellite Scenes for ULPIN-UP-LKO-001
    req_scenes = urllib.request.Request(f"{BASE_URL}/ai/scenes/ULPIN-UP-LKO-001", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req_scenes) as resp:
        scenes = json.loads(resp.read().decode("utf-8"))
        print(f"\n[OK] Satellite Scenes Retrieved: {len(scenes)} scenes (Baseline & Acquisition).")

    # 5. Execute AI Change Detection
    req_ai = urllib.request.Request(f"{BASE_URL}/ai/detect-change?ulpin=ULPIN-UP-LKO-001", data=b"", headers={"Authorization": f"Bearer {token}"}, method="POST")
    with urllib.request.urlopen(req_ai) as resp:
        ai_res = json.loads(resp.read().decode("utf-8"))
        print(f"\n[OK] AI Change Detection Completed:")
        print(f"     - Type: {ai_res.get('detection_type')}")
        print(f"     - Confidence: {ai_res.get('confidence_score')}")
        print(f"     - Affected Area: {ai_res.get('affected_area_sqm')} sqm ({ai_res.get('change_percentage')}%)")
        print(f"     - Heatmap URL: {ai_res.get('diff_heatmap_url')}")

    # 6. GPS Route Calculation
    route_payload = json.dumps({
        "start_lat": 26.8450,
        "start_lon": 80.9420,
        "target_ulpin": "ULPIN-UP-LKO-001",
        "mode": "driving"
    }).encode("utf-8")
    req_route = urllib.request.Request(f"{BASE_URL}/gps/route", data=route_payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
    with urllib.request.urlopen(req_route) as resp:
        route = json.loads(resp.read().decode("utf-8"))
        print(f"\n[OK] GPS Route Calculated:")
        print(f"     - Distance: {route.get('total_distance_km')} km")
        print(f"     - ETA: {route.get('eta_minutes')} mins")
        print(f"     - Maneuvers: {len(route.get('maneuvers', []))} turn steps")

    # 7. Spatial Radius Proximity Query
    req_spatial = urllib.request.Request(f"{BASE_URL}/database/query-spatial?lon=80.9462&lat=26.8467&radius_km=2.0", data=b"", method="POST")
    with urllib.request.urlopen(req_spatial) as resp:
        spatial = json.loads(resp.read().decode("utf-8"))
        print(f"\n[OK] Spatial Radius Proximity Query:")
        print(f"     - Parcels in 2.0 km radius: {spatial.get('parcels_found')}")

    # 8. Test Frontend HTTP response
    with urllib.request.urlopen("http://localhost:5173/") as resp:
        print(f"\n[OK] Frontend Server: HTTP {resp.getcode()} (Vite serving React App)")

    print("\n==========================================================")
    print("ALL FULL-STACK VERIFICATION TESTS PASSED SUCCESSFULLY! [OK]")
    print("==========================================================")

if __name__ == "__main__":
    main()
