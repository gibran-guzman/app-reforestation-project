const db = require('../config/db');

const create = async (data) => {
  const queryText = `
    INSERT INTO species (scientific_name, common_name, description, ideal_soil_type)
    VALUES ($1, $2, $3, $4) RETURNING *`;

  const values = [data.scientific_name, data.common_name, data.description, data.ideal_soil_type];
  const result = await db.query(queryText, values);
  return result.rows[0];
};

module.exports = { create };
