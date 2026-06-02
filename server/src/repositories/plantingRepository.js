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

const findByConflictKey = async (zoneId, speciesId, plantedAt, plantedBy) => {
  const result = await db.query(`
    SELECT ${columns.join(', ')}
    FROM planting_sites
    WHERE zone_id = $1 AND species_id = $2 AND planted_at::date = $3::date AND planted_by = $4
    LIMIT 1
  `, [zoneId, speciesId, plantedAt, plantedBy]);
  return result.rows[0] || null;
};

const update = async (id, data) => {
  const result = await db.query(`
    UPDATE planting_sites
    SET initial_ph = $1, initial_humidity = $2, initial_soil_texture = $3,
        location = ST_SetSRID(ST_MakePoint($4, $5), 4326)
    WHERE id = $6
    RETURNING ${columns.join(', ')}
  `, [
    data.initial_ph,
    data.initial_humidity,
    data.initial_soil_texture,
    data.location.lng,
    data.location.lat,
    id,
  ]);
  return result.rows[0];
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

const buildWhereClause = (filters) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.zone_id) {
    conditions.push(`ps.zone_id = $${idx++}`);
    params.push(filters.zone_id);
  }
  if (filters.species_id) {
    conditions.push(`ps.species_id = $${idx++}`);
    params.push(filters.species_id);
  }
  if (filters.from) {
    conditions.push(`ps.planted_at >= $${idx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`ps.planted_at <= $${idx++}`);
    params.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
};

const findAll = async (page = 1, limit = 50, filters = {}) => {
  const offset = (page - 1) * limit;
  const { where, params: whereParams } = buildWhereClause(filters);

  const countResult = await db.query(`SELECT COUNT(*) FROM planting_sites ps ${where}`, whereParams);
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await db.query(`
    SELECT ${listColumns.join(', ')}
    FROM planting_sites ps
    LEFT JOIN species sc ON sc.id = ps.species_id
    LEFT JOIN intervention_zones iz ON iz.id = ps.zone_id
    ${where}
    ORDER BY ps.created_at DESC
    LIMIT $1 OFFSET $2
  `, [...whereParams, limit, offset]);

  return { rows: result.rows, total };
};

const updatePhotoUrl = async (id, photoUrl) => {
  const result = await db.query(`
    UPDATE planting_sites SET photo_url = $1 WHERE id = $2
    RETURNING ${columns.join(', ')}
  `, [photoUrl, id]);
  return result.rows[0];
};

module.exports = { create, findAll, findById, findByZoneId, findByConflictKey, update, isPointInZone, updatePhotoUrl };
