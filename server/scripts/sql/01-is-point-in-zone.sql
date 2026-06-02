CREATE OR REPLACE FUNCTION is_point_in_zone(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  zone_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  zone_geom GEOMETRY;
BEGIN
  SELECT geometry INTO zone_geom FROM intervention_zones WHERE id = zone_id;
  IF zone_geom IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN ST_Within(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    zone_geom
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
