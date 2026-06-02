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

const findByPlantingSiteId = async (plantingSiteId) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}
    FROM monitoring_records
    WHERE planting_site_id = $1
    ORDER BY visit_date DESC, created_at DESC
  `, [plantingSiteId]);
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}
    FROM monitoring_records WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
};

const update = async (id, data) => {
  const sets = [];
  const params = [];
  let idx = 1;

  const fields = ['visit_date', 'ph', 'humidity', 'soil_texture', 'survival_status', 'vigor', 'notes', 'photo_url'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      params.push(data[field]);
    }
  }

  if (sets.length === 0) return findById(id);

  params.push(id);
  const result = await db.query(`
    UPDATE monitoring_records SET ${sets.join(', ')} WHERE id = $${idx}
    RETURNING ${columns.join(', ')}
  `, params);
  return result.rows[0];
};

const remove = async (id) => {
  await db.query('DELETE FROM monitoring_records WHERE id = $1', [id]);
};

module.exports = { create, findByPlantingSiteId, findById, update, remove };
