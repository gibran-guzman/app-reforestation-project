const db = require('../config/db');

const createProfile = async (id, fullName, role) => {
  const result = await db.query(
    'INSERT INTO profiles (id, full_name, role) VALUES ($1, $2, $3) RETURNING id, full_name, role',
    [id, fullName, role],
  );
  return result.rows[0];
};

const findProfileById = async (id) => {
  const result = await db.query(
    'SELECT id, full_name, role, created_at FROM profiles WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
};

module.exports = { createProfile, findProfileById };
