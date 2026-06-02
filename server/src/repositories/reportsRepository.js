const db = require('../config/db');

const latestMonitoringCte = `
  WITH latest_monitoring AS (
    SELECT DISTINCT ON (mr.planting_site_id)
      mr.planting_site_id, mr.survival_status, mr.visit_date
    FROM monitoring_records mr
    ORDER BY mr.planting_site_id, mr.visit_date DESC, mr.created_at DESC
  )
`;

const buildFilters = (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.zone_id) {
    conditions.push(`ps.zone_id = $${idx++}`);
    params.push(filters.zone_id);
  }
  if (filters.species_id) {
    conditions.push(`ps.species_id = $${idx++}`);
    params.push(filters.species_id);
  }
  if (filters.from) {
    conditions.push(`ps.planted_at >= $${idx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`ps.planted_at <= $${idx++}`);
    params.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
};

const getSurvivalRate = async (filters = {}) => {
  const { where, params } = buildFilters(filters);

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      COUNT(ps.id)::int AS total,
      COUNT(lm.planting_site_id)::int AS monitored,
      COUNT(CASE WHEN lm.survival_status = 'alive' THEN 1 END)::int AS alive,
      COUNT(CASE WHEN lm.survival_status = 'struggling' THEN 1 END)::int AS struggling,
      COUNT(CASE WHEN lm.survival_status = 'dead' THEN 1 END)::int AS dead,
      COUNT(CASE WHEN lm.survival_status IS NULL THEN 1 END)::int AS unmonitored
    FROM planting_sites ps
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
  `, params);

  return result.rows[0];
};

const getSurvivalRateBySpecies = async (filters = {}) => {
  const { where, params } = buildFilters(filters);

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      s.id, s.common_name, s.scientific_name,
      COUNT(ps.id)::int AS total_planted,
      COUNT(lm.planting_site_id)::int AS monitored,
      COUNT(CASE WHEN lm.survival_status = 'alive' THEN 1 END)::int AS alive,
      COUNT(CASE WHEN lm.survival_status = 'struggling' THEN 1 END)::int AS struggling,
      COUNT(CASE WHEN lm.survival_status = 'dead' THEN 1 END)::int AS dead
    FROM species s
    LEFT JOIN planting_sites ps ON ps.species_id = s.id
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    GROUP BY s.id, s.common_name, s.scientific_name
    ORDER BY total_planted DESC
  `, params);

  return result.rows;
};

const getSurvivalRateByZone = async (filters = {}) => {
  const { where, params } = buildFilters(filters);

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      z.id, z.name,
      COUNT(ps.id)::int AS total_plantings,
      COUNT(lm.planting_site_id)::int AS monitored,
      COUNT(CASE WHEN lm.survival_status = 'alive' THEN 1 END)::int AS alive,
      COUNT(CASE WHEN lm.survival_status = 'struggling' THEN 1 END)::int AS struggling,
      COUNT(CASE WHEN lm.survival_status = 'dead' THEN 1 END)::int AS dead
    FROM intervention_zones z
    LEFT JOIN planting_sites ps ON ps.zone_id = z.id
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    GROUP BY z.id, z.name
    ORDER BY total_plantings DESC
  `, params);

  return result.rows;
};

const getAllPlantingsForReport = async (filters = {}) => {
  const { where, params } = buildFilters(filters);

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      ps.id, ps.zone_id, ps.species_id,
      ST_AsGeoJSON(ps.location)::jsonb AS location,
      ps.planted_at, ps.planted_by,
      ps.initial_ph, ps.initial_humidity, ps.initial_soil_texture,
      ps.photo_url, ps.created_at,
      sc.common_name AS species_name,
      iz.name AS zone_name,
      lm.survival_status,
      lm.visit_date AS last_monitoring_date
    FROM planting_sites ps
    LEFT JOIN species sc ON sc.id = ps.species_id
    LEFT JOIN intervention_zones iz ON iz.id = ps.zone_id
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    ORDER BY ps.created_at DESC
  `, params);

  return result.rows;
};

module.exports = { getSurvivalRate, getSurvivalRateBySpecies, getSurvivalRateByZone, getAllPlantingsForReport };
