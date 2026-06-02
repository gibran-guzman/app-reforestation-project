const db = require('../config/db');

const buildFilters = (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.zone_id) { conditions.push(`ps.zone_id = $${idx++}`); params.push(filters.zone_id); }
  if (filters.species_id) { conditions.push(`ps.species_id = $${idx++}`); params.push(filters.species_id); }
  if (filters.from) { conditions.push(`ps.planted_at >= $${idx++}`); params.push(filters.from); }
  if (filters.to) { conditions.push(`ps.planted_at <= $${idx++}`); params.push(filters.to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
};

const getHeatmapData = async (filters = {}) => {
  const { where, params } = buildFilters(filters);

  const result = await db.query(`
    WITH latest_monitoring AS (
      SELECT DISTINCT ON (mr.planting_site_id)
        mr.planting_site_id, mr.survival_status, mr.visit_date
      FROM monitoring_records mr
      ORDER BY mr.planting_site_id, mr.visit_date DESC, mr.created_at DESC
    )
    SELECT
      ST_Y(ps.location::geometry) AS lat,
      ST_X(ps.location::geometry) AS lng,
      ps.planted_at,
      lm.survival_status
    FROM planting_sites ps
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    ORDER BY ps.planted_at
  `, params);

  return result.rows.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    planted_at: r.planted_at,
    weight: r.survival_status === 'dead' ? 1 : r.survival_status === 'struggling' ? 0.5 : r.survival_status === 'alive' ? 0 : null,
    survival_status: r.survival_status,
  }));
};

module.exports = { getHeatmapData };
