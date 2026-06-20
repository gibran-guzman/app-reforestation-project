const db = require('../config/db');
const { buildWhereClause } = require('../utils/queryBuilder');
const { latestMonitoringCte } = require('../utils/cteQueries');
const { MAX_GEOJSON_FEATURES } = require('../config/constants');

const columns = [
  'id', 'zone_id', 'species_id',
  'ST_AsGeoJSON(location)::jsonb AS location',
  'planted_at', 'planted_by',
  'initial_ph', 'initial_humidity', 'initial_soil_texture',
  'photo_url', 'created_at',
];

const listColumns = [
  'ps.id', 'ps.zone_id', 'ps.species_id',
  'ST_AsGeoJSON(ps.location)::jsonb AS location',
  'ps.planted_at', 'ps.planted_by',
  'ps.initial_ph', 'ps.initial_humidity', 'ps.initial_soil_texture',
  'ps.photo_url', 'ps.created_at',
  'sc.common_name AS species_name',
  'iz.name AS zone_name',
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
  const sets = [];
  const values = [];
  let i = 1;

  if (data.initial_ph !== undefined) { sets.push(`initial_ph = $${i++}`); values.push(data.initial_ph); }
  if (data.initial_humidity !== undefined) { sets.push(`initial_humidity = $${i++}`); values.push(data.initial_humidity); }
  if (data.initial_soil_texture !== undefined) { sets.push(`initial_soil_texture = $${i++}`); values.push(data.initial_soil_texture); }
  if (data.location !== undefined) {
    sets.push(`location = ST_SetSRID(ST_MakePoint($${i++}, $${i++}), 4326)`);
    values.push(data.location.lng, data.location.lat);
  }

  if (sets.length === 0) return findById(id);

  values.push(id);
  const result = await db.query(`
    UPDATE planting_sites SET ${sets.join(', ')} WHERE id = $${i}
    RETURNING ${columns.join(', ')}
  `, values);
  return result.rows[0];
};

const isPointInZone = async (lat, lng, zoneId) => {
  const result = await db.query(
    'SELECT is_point_in_zone($1, $2, $3) AS valid',
    [lng, lat, zoneId]
  );
  return result.rows[0]?.valid || false;
};

const findAll = async (page = 1, limit = 50, filters = {}) => {
  const offset = (page - 1) * limit;
  const { where, params: whereParams } = buildWhereClause(filters, 'ps');

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

const findGeoJson = async (filters = {}) => {
  const { where, params } = buildWhereClause(filters, 'ps');
  const limitParamIndex = params.length + 1;

  const result = await db.query(`
    ${latestMonitoringCte}
    SELECT
      ps.id,
      ST_AsGeoJSON(ps.location)::jsonb AS geometry,
      jsonb_build_object(
        'planting_id', ps.id,
        'species_name', sc.common_name,
        'scientific_name', sc.scientific_name,
        'zone_name', iz.name,
        'planted_at', ps.planted_at,
        'survival_status', COALESCE(lm.survival_status, 'unmonitored'),
        'last_monitoring_date', lm.visit_date,
        'initial_ph', ps.initial_ph,
        'initial_humidity', ps.initial_humidity,
        'photo_url', ps.photo_url
      ) AS properties
    FROM planting_sites ps
    LEFT JOIN species sc ON sc.id = ps.species_id
    LEFT JOIN intervention_zones iz ON iz.id = ps.zone_id
    LEFT JOIN latest_monitoring lm ON lm.planting_site_id = ps.id
    ${where}
    ORDER BY ps.created_at DESC
    LIMIT $${limitParamIndex}
  `, [...params, MAX_GEOJSON_FEATURES]);

  const features = result.rows.map((r) => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: r.properties,
  }));

  return { type: 'FeatureCollection', features };
};

const updatePhotoUrl = async (id, photoUrl) => {
  const result = await db.query(`
    UPDATE planting_sites SET photo_url = $1 WHERE id = $2
    RETURNING ${columns.join(', ')}
  `, [photoUrl, id]);
  return result.rows[0];
};

module.exports = { create, findAll, findById, findByConflictKey, update, isPointInZone, updatePhotoUrl, findGeoJson };
