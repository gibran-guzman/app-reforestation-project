const db = require('../config/db');

const findAll = async () => {
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
  `);
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
  const result = await db.query(`
    INSERT INTO intervention_zones (name, description, geometry)
    VALUES ($1, $2, ST_GeomFromGeoJSON($3))
    RETURNING id, name, description, ST_AsGeoJSON(geometry)::jsonb AS geometry, created_at, updated_at
  `, [data.name, data.description, JSON.stringify(data.geometry)]);
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
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await db.query(`
    DELETE FROM intervention_zones WHERE id = $1
    RETURNING id
  `, [id]);
  return result.rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
