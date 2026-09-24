-- =====================================================================
-- LAND STACK - PostgreSQL + PostGIS Spatial Database Schema
-- Digital Land Governance Platform with Spatial Analytics & AI Tracking
-- =====================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables in reverse dependency order if recreating
DROP TABLE IF EXISTS gps_telemetry CASCADE;
DROP TABLE IF EXISTS satellite_imagery CASCADE;
DROP TABLE IF EXISTS anomalies CASCADE;
DROP TABLE IF EXISTS application_status_history CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS encumbrances CASCADE;
DROP TABLE IF EXISTS tax_records CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS ownership_ror CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Users Table with Role-Based Access Control (RBAC)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- citizen, officer, admin
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 4. Parcels Table with Native PostGIS Spatial Geometry (SRID 4326: WGS84)
CREATE TABLE parcels (
    ulpin VARCHAR(50) PRIMARY KEY, -- Unified Land Parcel Identification Number
    survey_number VARCHAR(100) NOT NULL,
    area DOUBLE PRECISION NOT NULL, -- in square meters
    land_use VARCHAR(100) NOT NULL, -- Agricultural, Residential, Commercial, Industrial, Forest
    geom GEOMETRY(Polygon, 4326) NOT NULL, -- PostGIS Polygon Geometry
    centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geom)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Indexes for lightning fast GIS queries
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX idx_parcels_centroid ON parcels USING GIST (centroid);
CREATE INDEX idx_parcels_survey ON parcels(survey_number);
CREATE INDEX idx_parcels_land_use ON parcels(land_use);

-- 5. Ownership & Record of Rights (RoR)
CREATE TABLE ownership_ror (
    id SERIAL PRIMARY KEY,
    parcel_ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    owner_name VARCHAR(255) NOT NULL,
    share DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ownership_ulpin ON ownership_ror(parcel_ulpin);

-- 6. Registrations & Deed Records
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    parcel_ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_date DATE NOT NULL,
    parties JSONB NOT NULL,
    consideration_amount DOUBLE PRECISION NOT NULL,
    registered_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reg_ulpin ON registrations(parcel_ulpin);

-- 7. Tax Records
CREATE TABLE tax_records (
    id SERIAL PRIMARY KEY,
    parcel_ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    assessment_year INTEGER NOT NULL,
    tax_amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Paid, Pending, Overdue
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tax_ulpin ON tax_records(parcel_ulpin);

-- 8. Encumbrances (Mortgages, Court Stays, Liens)
CREATE TABLE encumbrances (
    id SERIAL PRIMARY KEY,
    parcel_ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- Mortgage, CourtStay, TaxLien, Easement
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Cleared
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encumbrance_ulpin ON encumbrances(parcel_ulpin);

-- 9. Service Requests & Applications
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- OwnershipTransfer, LandUseChange, Mutation, NewConstructionPermission
    applicant_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted', -- Submitted, UnderReview, Approved, Rejected
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by INTEGER REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_ulpin ON applications(ulpin);
CREATE INDEX idx_app_applicant ON applications(applicant_id);
CREATE INDEX idx_app_status ON applications(status);

-- 10. Application Status History (Audit Trail)
CREATE TABLE application_status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comments TEXT
);

-- 11. Satellite & Aerial Imagery Repository
CREATE TABLE satellite_imagery (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    scene_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sensor_name VARCHAR(100) NOT NULL, -- Sentinel-2 MSI, PlanetScope 3m, Cartosat-3, Drone UAV
    resolution_meters DOUBLE PRECISION NOT NULL,
    cloud_coverage DOUBLE PRECISION DEFAULT 0.0,
    image_path VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) NOT NULL DEFAULT 'baseline', -- baseline, acquisition, drone_ortho
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sat_ulpin ON satellite_imagery(ulpin);
CREATE INDEX idx_sat_date ON satellite_imagery(scene_date);

-- 12. AI Land Monitoring Anomalies & Change Detections
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    detection_type VARCHAR(100) NOT NULL, -- NewConstruction, LandUseChange, Encroachment, Deforestation
    description TEXT NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL, -- 0.0 to 1.0
    affected_area_sqm DOUBLE PRECISION DEFAULT 0.0,
    change_percentage DOUBLE PRECISION DEFAULT 0.0,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'New', -- New, UnderInvestigation, Resolved, FalsePositive
    image_before_path VARCHAR(500),
    image_after_path VARCHAR(500),
    diff_heatmap_path VARCHAR(500),
    detected_by_system VARCHAR(100) DEFAULT 'AI_Vision_Engine_v2',
    change_geom GEOMETRY(MultiPolygon, 4326), -- PostGIS Geometry of the detected change area
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anomalies_ulpin ON anomalies(ulpin);
CREATE INDEX idx_anomalies_status ON anomalies(status);
CREATE INDEX idx_anomalies_geom ON anomalies USING GIST (change_geom);

-- 13. GPS Telemetry & Patrol Tracking
CREATE TABLE gps_telemetry (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL, -- PATROL-OFFICER-01, DRONE-UNIT-04
    officer_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    altitude DOUBLE PRECISION DEFAULT 0.0,
    speed_kmh DOUBLE PRECISION DEFAULT 0.0,
    heading_degrees DOUBLE PRECISION DEFAULT 0.0,
    accuracy_meters DOUBLE PRECISION DEFAULT 5.0,
    status VARCHAR(50) DEFAULT 'active_patrol', -- active_patrol, investigating, en_route, standby
    target_ulpin VARCHAR(50) REFERENCES parcels(ulpin) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gps_geom ON gps_telemetry USING GIST (geom);
CREATE INDEX idx_gps_device ON gps_telemetry(device_id);
CREATE INDEX idx_gps_timestamp ON gps_telemetry(timestamp DESC);

-- 14. Documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    parcel_ulpin VARCHAR(50) NOT NULL REFERENCES parcels(ulpin) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_docs_ulpin ON documents(parcel_ulpin);

-- =====================================================================
-- POSTGIS SPATIAL STORED PROCEDURES & HELPER FUNCTIONS
-- =====================================================================

-- Function 1: Find Parcels Within Radius of GPS Location
CREATE OR REPLACE FUNCTION get_parcels_within_radius(
    lon DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
    ulpin VARCHAR(50),
    survey_number VARCHAR(100),
    land_use VARCHAR(100),
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.ulpin,
        p.survey_number,
        p.land_use,
        ST_Distance(p.geom::geography, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography) AS distance_meters
    FROM parcels p
    WHERE ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, radius_meters)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Check if GPS coordinate is inside parcel boundary (Geofencing)
CREATE OR REPLACE FUNCTION check_geofence_containment(
    lon DOUBLE PRECISION,
    lat DOUBLE PRECISION
)
RETURNS TABLE (
    inside_parcel VARCHAR(50),
    survey_number VARCHAR(100),
    land_use VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.ulpin,
        p.survey_number,
        p.land_use
    FROM parcels p
    WHERE ST_Contains(p.geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 15. Spatial Analytics Summary View
CREATE OR REPLACE VIEW v_parcel_spatial_summary AS
SELECT 
    p.ulpin,
    p.survey_number,
    p.area,
    p.land_use,
    ST_AsGeoJSON(p.geom)::json AS geojson,
    ST_X(p.centroid) AS center_lon,
    ST_Y(p.centroid) AS center_lat,
    COUNT(DISTINCT a.id) AS active_anomalies_count,
    COUNT(DISTINCT app.id) AS pending_applications_count
FROM parcels p
LEFT JOIN anomalies a ON p.ulpin = a.ulpin AND a.status IN ('New', 'UnderInvestigation')
LEFT JOIN applications app ON p.ulpin = app.ulpin AND app.status IN ('Submitted', 'UnderReview')
GROUP BY p.ulpin, p.survey_number, p.area, p.land_use, p.geom, p.centroid;

COMMENT ON VIEW v_parcel_spatial_summary IS 'Real-time spatial summary combining PostGIS geometries with live anomalies and application alerts.';
