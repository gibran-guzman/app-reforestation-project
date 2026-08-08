const db = require('../config/db');
const { buildWhereClause } = require('../utils/queryBuilder');
const { latestMonitoringCte } = require('../utils/cteQueries');
const { MAX_REPORT_LIMIT } = require('../config/constants');

const getSurvivalRate = async (filters = {}) => {
  const { where, params } = buildWhereClause(filters, 'ps');

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
  const { where, params } = buildWhereClause(filters, 'ps');

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
  const { where, params } = buildWhereClause(filters, 'ps');

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

const getAllPlantingsForReport = async (filters = {}, limit = MAX_REPORT_LIMIT) => {
  const { where, params } = buildWhereClause(filters, 'ps');

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
    LIMIT $1
  `, [...params, limit]);

  return result.rows;
};

const getPlantingEvolution = async (filters = {}) => {
  const { where, params } = buildWhereClause(filters, 'ps');

  const result = await db.query(`
    SELECT
      to_char(ps.planted_at, 'YYYY-MM') AS period,
      COUNT(*)::int AS total
    FROM planting_sites ps
    ${where}
    GROUP BY to_char(ps.planted_at, 'YYYY-MM')
    ORDER BY period
  `, params);

  return result.rows;
};

module.exports = { getSurvivalRate, getSurvivalRateBySpecies, getSurvivalRateByZone, getAllPlantingsForReport, getPlantingEvolution };
