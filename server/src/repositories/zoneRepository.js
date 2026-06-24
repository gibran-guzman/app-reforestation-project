const db = require('../config/db');
const { MAX_LIST_LIMIT } = require('../config/constants');
const MemoryCache = require('../utils/memoryCache');

const listCache = new MemoryCache();

const findAll = async () => {
  const cached = listCache.get('all');
  if (cached) return cached;
  const result = await db.query(`
    SELECT
      id,
      name,
      description,
      ST_AsGeoJSON(geometry)::jsonb AS geometry,
      created_at,
      updated_at
    FROM intervention_zones
    ORDER BY name
    LIMIT ${MAX_LIST_LIMIT}
  `);
  listCache.set('all', result.rows);
  return result.rows;
};

const findByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const result = await db.query(
    `SELECT * FROM intervention_zones WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`,
    ids
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(`
    SELECT
      id,
      name,
      description,
      ST_AsGeoJSON(geometry)::jsonb AS geometry,
      created_at,
      updated_at
    FROM intervention_zones
    WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
};

const create = async (data) => {
  const geometry = data.geometry;
  const result = await db.query(`
    INSERT INTO intervention_zones (name, description, geometry)
    VALUES ($1, $2, ${geometry ? 'ST_GeomFromGeoJSON($3)' : 'NULL'})
    RETURNING id, name, description, ${geometry ? "ST_AsGeoJSON(geometry)::jsonb" : "NULL"} AS geometry, created_at, updated_at
  `, geometry ? [data.name, data.description, JSON.stringify(geometry)] : [data.name, data.description]);
  listCache.invalidate('all');
  return result.rows[0];
};

const update = async (id, data) => {
  const sets = [];
  const values = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    sets.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.geometry !== undefined) {
    sets.push(`geometry = ST_GeomFromGeoJSON($${paramIndex++})`);
    values.push(JSON.stringify(data.geometry));
  }

  if (sets.length === 0) return findById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query(`
    UPDATE intervention_zones
    SET ${sets.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, description, ST_AsGeoJSON(geometry)::jsonb AS geometry, created_at, updated_at
  `, values);
  listCache.invalidate('all');
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await db.query(`
    DELETE FROM intervention_zones WHERE id = $1
    RETURNING id
  `, [id]);
  listCache.invalidate('all');
  return result.rows[0] || null;
};

module.exports = { findAll, findByIds, findById, create, update, remove };
