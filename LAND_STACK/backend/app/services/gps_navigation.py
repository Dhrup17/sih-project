import math
from typing import Dict, Any, List, Tuple, Optional


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon pairs using Haversine formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate compass bearing (0-360 degrees) from point 1 to point 2."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0


def point_in_polygon(lat: float, lon: float, polygon_coords: List[List[float]]) -> bool:
    """Ray casting algorithm to determine if [lat, lon] is inside a polygon [[lon, lat], ...]."""
    inside = False
    n = len(polygon_coords)
    if n < 3:
        return False

    p1x, p1y = polygon_coords[0][0], polygon_coords[0][1]
    for i in range(1, n + 1):
        p2x, p2y = polygon_coords[i % n][0], polygon_coords[i % n][1]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def generate_navigation_route(
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    dest_name: str = "Target Parcel",
    mode: str = "driving"
) -> Dict[str, Any]:
    """
    Generates a realistic multi-waypoint navigation route with turn-by-turn guidance,
    distance, ETA, and compass heading instructions.
    """
    direct_dist = haversine_distance(start_lat, start_lon, dest_lat, dest_lon)
    # Typical road network winding factor
    road_factor = 1.25
    total_dist_meters = round(direct_dist * road_factor, 1)
    total_dist_km = round(total_dist_meters / 1000.0, 2)

    # Average speeds: driving = 36 km/h (10 m/s), walking = 5 km/h (1.4 m/s)
    speed_ms = 10.0 if mode == "driving" else 1.4
    total_seconds = int(total_dist_meters / speed_ms)
    eta_minutes = max(1, round(total_seconds / 60.0))

    # Generate realistic intermediate road waypoints
    # Create an L-shaped or Z-shaped grid route
    num_steps = 5
    coords: List[List[float]] = []
    coords.append([start_lon, start_lat])

    # Intermediates with slight road doglegs
    mid_lat = start_lat + (dest_lat - start_lat) * 0.4
    mid_lon1 = start_lon + (dest_lon - start_lon) * 0.1
    coords.append([mid_lon1, mid_lat])

    mid_lon2 = start_lon + (dest_lon - start_lon) * 0.7
    mid_lat2 = start_lat + (dest_lat - start_lat) * 0.5
    coords.append([mid_lon2, mid_lat2])

    mid_lat3 = start_lat + (dest_lat - start_lat) * 0.85
    mid_lon3 = dest_lon
    coords.append([mid_lon3, mid_lat3])

    coords.append([dest_lon, dest_lat])

    # Generate Turn-by-Turn Maneuvers
    maneuvers = []
    initial_bearing = calculate_bearing(start_lat, start_lon, coords[1][1], coords[1][0])

    maneuvers.append({
        "step": 1,
        "type": "depart",
        "instruction": f"Depart from current location, head {get_cardinal_direction(initial_bearing)} on Field Access Link Road",
        "distance_meters": round(total_dist_meters * 0.25, 0),
        "duration_seconds": round(total_seconds * 0.25, 0),
        "bearing": round(initial_bearing, 1),
        "location": [start_lon, start_lat]
    })

    b2 = calculate_bearing(coords[1][1], coords[1][0], coords[2][1], coords[2][0])
    turn1_dir = "right" if ((b2 - initial_bearing + 360) % 360) < 180 else "left"
    maneuvers.append({
        "step": 2,
        "type": f"turn-{turn1_dir}",
        "instruction": f"Turn {turn1_dir} onto Sector Road towards Vidhan Sabha bypass",
        "distance_meters": round(total_dist_meters * 0.35, 0),
        "duration_seconds": round(total_seconds * 0.35, 0),
        "bearing": round(b2, 1),
        "location": coords[1]
    })

    b3 = calculate_bearing(coords[2][1], coords[2][0], coords[3][1], coords[3][0])
    maneuvers.append({
        "step": 3,
        "type": "continue",
        "instruction": f"Continue straight along Lucknow Cadastral Corridor for {int(total_dist_meters * 0.25)}m",
        "distance_meters": round(total_dist_meters * 0.25, 0),
        "duration_seconds": round(total_seconds * 0.25, 0),
        "bearing": round(b3, 1),
        "location": coords[2]
    })

    maneuvers.append({
        "step": 4,
        "type": "arrive",
        "instruction": f"Arrive at destination: {dest_name} (Boundary Checkpoint & Inspection Point)",
        "distance_meters": round(total_dist_meters * 0.15, 0),
        "duration_seconds": round(total_seconds * 0.15, 0),
        "bearing": round(calculate_bearing(coords[3][1], coords[3][0], dest_lat, dest_lon), 1),
        "location": [dest_lon, dest_lat]
    })

    return {
        "destination": dest_name,
        "total_distance_meters": total_dist_meters,
        "total_distance_km": total_dist_km,
        "eta_minutes": eta_minutes,
        "eta_seconds": total_seconds,
        "travel_mode": mode,
        "bearing_degrees": round(initial_bearing, 1),
        "cardinal_direction": get_cardinal_direction(initial_bearing),
        "route_geojson": {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {
                "distance_km": total_dist_km,
                "eta_minutes": eta_minutes
            }
        },
        "maneuvers": maneuvers
    }


def get_cardinal_direction(degrees: float) -> str:
    """Convert degrees (0-360) to 8-point cardinal compass direction."""
    dirs = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]
    idx = int((degrees + 22.5) / 45.0) % 8
    return dirs[idx]
