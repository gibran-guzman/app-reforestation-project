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
    SELECT ${listColumns.join(', ')}
    FROM planting_sites ps
    LEFT JOIN species sc ON sc.id = ps.species_id
    LEFT JOIN intervention_zones iz ON iz.id = ps.zone_id
    WHERE ps.id = $1
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

const listColumns = [
  'ps.id', 'ps.zone_id', 'ps.species_id',
  'ST_AsGeoJSON(ps.location)::jsonb AS location',
  'ps.planted_at', 'ps.planted_by',
  'ps.initial_ph', 'ps.initial_humidity', 'ps.initial_soil_texture',
  'ps.photo_url', 'ps.created_at',
  'sc.common_name AS species_name',
  'iz.name AS zone_name',
];

const findAll = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) FROM planting_sites');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await db.query(`
    SELECT ${listColumns.join(', ')}
    FROM planting_sites ps
    LEFT JOIN species sc ON sc.id = ps.species_id
    LEFT JOIN intervention_zones iz ON iz.id = ps.zone_id
    ORDER BY ps.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return { rows: result.rows, total };
};

const updatePhotoUrl = async (id, photoUrl) => {
  const result = await db.query(`
    UPDATE planting_sites SET photo_url = $1 WHERE id = $2
    RETURNING ${columns.join(', ')}
  `, [photoUrl, id]);
  return result.rows[0];
};

module.exports = { create, findAll, findById, findByZoneId, isPointInZone, updatePhotoUrl };
