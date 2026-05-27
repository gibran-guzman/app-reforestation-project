const db = require('../config/db');

const columns = [
  'id', 'zone_id', 'species_id',
  'ST_AsGeoJSON(location)::jsonb AS location',
  'planted_at', 'planted_by',
  'initial_ph', 'initial_humidity', 'initial_soil_texture',
  'photo_url', 'created_at',
];

const create = async (data) => {
  const result = await db.query(`
    INSERT INTO planting_sites (zone_id, species_id, location, planted_at, planted_by, initial_ph, initial_humidity, initial_soil_texture)
    VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9)
    RETURNING ${columns.join(', ')}
  `, [
    data.zone_id,
    data.species_id,
    data.location.lng,
    data.location.lat,
    data.planted_at,
    data.planted_by,
    data.initial_ph,
    data.initial_humidity,
    data.initial_soil_texture,
  ]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}, zone_id, species_id
    FROM planting_sites WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
};

const findByZoneId = async (zoneId) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}
    FROM planting_sites WHERE zone_id = $1
    ORDER BY created_at DESC
  `, [zoneId]);
  return result.rows;
};

const isPointInZone = async (lat, lng, zoneId) => {
  const result = await db.query(
    'SELECT is_point_in_zone($1, $2, $3) AS valid',
    [lng, lat, zoneId]
  );
  return result.rows[0]?.valid || false;
};

module.exports = { create, findById, findByZoneId, isPointInZone };
