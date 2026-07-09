const db = require('../config/db');
const { MAX_LIST_LIMIT } = require('../config/constants');
const MemoryCache = require('../utils/memoryCache');

const listCache = new MemoryCache();

const columns = ['id', 'scientific_name', 'common_name', 'description', 'ideal_soil_type', 'recommended_altitude_min', 'recommended_altitude_max', 'created_at'];

const create = async (data) => {
  const result = await db.query(`
    INSERT INTO species (scientific_name, common_name, description, ideal_soil_type, recommended_altitude_min, recommended_altitude_max)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.scientific_name, data.common_name, data.description, data.ideal_soil_type, data.recommended_altitude_min, data.recommended_altitude_max]
  );
  listCache.invalidate('all');
  return result.rows[0];
};

const findAll = async () => {
  const cached = listCache.get('all');
  if (cached) return cached;
  const result = await db.query(`SELECT ${columns.join(', ')} FROM species ORDER BY created_at DESC LIMIT ${MAX_LIST_LIMIT}`);
  listCache.set('all', result.rows);
  return result.rows;
};

const findByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const result = await db.query(
    `SELECT ${columns.join(', ')} FROM species WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`,
    ids
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(`SELECT ${columns.join(', ')} FROM species WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const update = async (id, data) => {
  const sets = [];
  const values = [];
  let i = 1;

  if (data.scientific_name !== undefined) { sets.push(`scientific_name = $${i++}`); values.push(data.scientific_name); }
  if (data.common_name !== undefined) { sets.push(`common_name = $${i++}`); values.push(data.common_name); }
  if (data.description !== undefined) { sets.push(`description = $${i++}`); values.push(data.description); }
  if (data.ideal_soil_type !== undefined) { sets.push(`ideal_soil_type = $${i++}`); values.push(data.ideal_soil_type); }
  if (data.recommended_altitude_min !== undefined) { sets.push(`recommended_altitude_min = $${i++}`); values.push(data.recommended_altitude_min); }
  if (data.recommended_altitude_max !== undefined) { sets.push(`recommended_altitude_max = $${i++}`); values.push(data.recommended_altitude_max); }

  if (sets.length === 0) return findById(id);

  values.push(id);
  const result = await db.query(`
    UPDATE species SET ${sets.join(', ')} WHERE id = $${i}
    RETURNING ${columns.join(', ')}`, values);
  listCache.invalidate('all');
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await db.query('DELETE FROM species WHERE id = $1 RETURNING id', [id]);
  listCache.invalidate('all');
  return result.rows[0] || null;
};

module.exports = { create, findAll, findByIds, findById, update, remove };
