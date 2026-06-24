-- ================================================================
-- Migration 001: Initial Schema
-- Lloa Reforestation - Trazabilidad Ambiental
-- Requires: PostgreSQL 16+ with PostGIS extension
-- ================================================================

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Species catalog (table already exists, add altitude recommendations)
ALTER TABLE species
  ADD COLUMN IF NOT EXISTS recommended_altitude_min INTEGER,
  ADD COLUMN IF NOT EXISTS recommended_altitude_max INTEGER;

-- 3. User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.is_admin());

-- 4. Intervention zones
CREATE TABLE IF NOT EXISTS intervention_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_zones_geometry
  ON intervention_zones USING GIST (geometry);

ALTER TABLE intervention_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read zones"
  ON intervention_zones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify zones"
  ON intervention_zones FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update zones"
  ON intervention_zones FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Planting sites
CREATE TABLE IF NOT EXISTS planting_sites (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES intervention_zones(id) ON DELETE RESTRICT,
  species_id INTEGER NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
  location GEOMETRY(Point, 4326) NOT NULL,
  planted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  planted_by UUID REFERENCES profiles(id),
  initial_ph NUMERIC(4,1),
  initial_humidity NUMERIC(5,2),
  initial_soil_texture VARCHAR(50) CHECK (initial_soil_texture IN ('sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planting_sites_location
  ON planting_sites USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_planting_sites_zone
  ON planting_sites (zone_id);

CREATE INDEX IF NOT EXISTS idx_planting_sites_species
  ON planting_sites (species_id);

ALTER TABLE planting_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read planting sites"
  ON planting_sites FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Technicians and admins can insert planting sites"
  ON planting_sites FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'technician'))
  );

-- 6. Monitoring records
CREATE TABLE IF NOT EXISTS monitoring_records (
  id SERIAL PRIMARY KEY,
  planting_site_id INTEGER NOT NULL REFERENCES planting_sites(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ph NUMERIC(4,1),
  humidity NUMERIC(5,2),
  soil_texture VARCHAR(50) CHECK (soil_texture IN ('sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky')),
  survival_status VARCHAR(20) NOT NULL CHECK (survival_status IN ('alive', 'struggling', 'dead')),
  vigor VARCHAR(10) CHECK (vigor IN ('high', 'medium', 'low')),
  notes TEXT,
  photo_url TEXT,
  monitored_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_records_site
  ON monitoring_records (planting_site_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_records_survival
  ON monitoring_records (survival_status);

ALTER TABLE monitoring_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read monitoring records"
  ON monitoring_records FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Technicians and admins can insert monitoring records"
  ON monitoring_records FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'technician'))
  );

-- 7. Helper function: check if a point falls within an intervention zone
CREATE OR REPLACE FUNCTION is_point_in_zone(
  point_lon DOUBLE PRECISION,
  point_lat DOUBLE PRECISION,
  zone_id INTEGER
) RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM intervention_zones
    WHERE id = zone_id
      AND ST_Within(
        ST_SetSRID(ST_MakePoint(point_lon, point_lat), 4326),
        geometry
      )
  );
$$;

-- 8. Helper function: find zone that contains a given point
CREATE OR REPLACE FUNCTION find_zone_by_point(
  point_lon DOUBLE PRECISION,
  point_lat DOUBLE PRECISION
) RETURNS TABLE (
  zone_id INTEGER,
  zone_name VARCHAR(255)
)
LANGUAGE SQL STABLE
AS $$
  SELECT id, name
  FROM intervention_zones
  WHERE ST_Within(
    ST_SetSRID(ST_MakePoint(point_lon, point_lat), 4326),
    geometry
  )
  LIMIT 1;
$$;
