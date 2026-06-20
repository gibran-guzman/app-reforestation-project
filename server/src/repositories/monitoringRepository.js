const db = require('../config/db');

const columns = [
  'id', 'planting_site_id', 'visit_date',
  'ph', 'humidity', 'soil_texture',
  'survival_status', 'vigor', 'notes',
  'photo_url', 'monitored_by', 'created_at',
];

const create = async (data) => {
  const result = await db.query(`
    INSERT INTO monitoring_records (planting_site_id, visit_date, ph, humidity, soil_texture, survival_status, vigor, notes, photo_url, monitored_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING ${columns.join(', ')}
  `, [
    data.planting_site_id,
    data.visit_date,
    data.ph,
    data.humidity,
    data.soil_texture,
    data.survival_status,
    data.vigor,
    data.notes,
    data.photo_url,
    data.monitored_by,
  ]);
  return result.rows[0];
};

const findByPlantingSiteId = async (plantingSiteId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  const [countResult, result] = await Promise.all([
    db.query('SELECT COUNT(*) FROM monitoring_records WHERE planting_site_id = $1', [plantingSiteId]),
    db.query(`
      SELECT ${columns.join(', ')}
      FROM monitoring_records
      WHERE planting_site_id = $1
      ORDER BY visit_date DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `, [plantingSiteId, limit, offset]),
  ]);

  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}
    FROM monitoring_records WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
};

module.exports = { create, findByPlantingSiteId, findById };
