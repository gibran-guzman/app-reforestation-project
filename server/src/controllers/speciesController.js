const db = require('../config/db');

/**
 * Creates a new native species in the catalog.
 * This ensures environmental traceability before planting.
 */
const createSpecies = async (req, res) => {
  const { scientific_name, common_name, description, ideal_soil_type } = req.body;

  try {
    const queryText = `
      INSERT INTO species (scientific_name, common_name, description, ideal_soil_type)
      VALUES ($1, $2, $3, $4) RETURNING *`;
    
    const values = [scientific_name, common_name, description, ideal_soil_type];
    const result = await db.query(queryText, values);

    res.status(201).json({
      message: 'Native species registered successfully',
      data: result.rows
    });
  } catch (error) {
    console.error('Error creating species:', error);
    res.status(500).json({ error: 'Internal server error while creating species' });
  }
};

module.exports = { createSpecies };