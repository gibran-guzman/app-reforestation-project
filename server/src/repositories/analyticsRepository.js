const db = require('../config/db');
const { buildWhereClause } = require('../utils/queryBuilder');
const { latestMonitoringCte } = require('../utils/cteQueries');
const { MAX_HEATMAP_POINTS } = require('../config/constants');

const WEIGHT_MAP = {
  dead: 1,
  struggling: 0.5,
  alive: 0,
};

const getHeatmapData = async (filters = {}) => {
  const { where, params } = buildWhereClause(filters, 'ps');
  const limitParamIndex = params.length + 1;

  if (filters.interval) {
    const intervalSql = filters.interval === 'year'
      ? "to_char(ps.planted_at, 'YYYY')"
      : filters.interval === 'quarter'
        ? "concat(to_char(ps.planted_at, 'YYYY'), '-Q', ceil(extract(month from ps.planted_at) / 3.0)::int)"
        : "to_char(ps.planted_at, 'YYYY-MM')";

    const result = await db.query(`
      ${latestMonitoringCte}
      SELECT
        ${intervalSql} AS period_label,
        ST_Y(ps.location::geometry) AS lat,
        ST_X(ps.location::geometry) AS lng,
        ps.planted_at,
        lm.survival_status
      FROM planting_sites ps
      LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
      ${where}
      ORDER BY period_label, ps.planted_at
      LIMIT $${limitParamIndex}
    `, [...params, MAX_HEATMAP_POINTS]);

    return result.rows.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      planted_at: r.planted_at,
      weight: WEIGHT_MAP[r.survival_status] ?? null,
      survival_status: r.survival_status,
      period_label: r.period_label,
    }));
  }

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      ST_Y(ps.location::geometry) AS lat,
      ST_X(ps.location::geometry) AS lng,
      ps.planted_at,
      lm.survival_status
    FROM planting_sites ps
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    ORDER BY ps.planted_at
    LIMIT $${limitParamIndex}
  `, [...params, MAX_HEATMAP_POINTS]);

  return result.rows.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    planted_at: r.planted_at,
    weight: WEIGHT_MAP[r.survival_status] ?? null,
    survival_status: r.survival_status,
  }));
};

module.exports = { getHeatmapData };
