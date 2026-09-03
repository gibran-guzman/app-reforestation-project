const plantingRepository = require('../repositories/plantingRepository');
const speciesRepository = require('../repositories/speciesRepository');
const zoneRepository = require('../repositories/zoneRepository');
const monitoringRepository = require('../repositories/monitoringRepository');
const db = require('../config/db');
const { AppError, NotFoundError, ValidationError } = require('../errors/AppError');
const logger = require('../utils/logger');
const { CONCURRENCY_LIMIT } = require('../config/constants');
const { validateSyncItem } = require('../validators/plantingValidator');
const { signPhotoRows, signPhotoRow } = require('../utils/signPhoto');

const create = async (body, userId) => {
  const [zone, species] = await Promise.all([
    zoneRepository.findById(body.zone_id),
    speciesRepository.findById(body.species_id),
  ]);

  if (!zone) {
    throw new NotFoundError('Zona de intervención no encontrada');
  }

  if (!species) {
    throw new NotFoundError('Especie no encontrada');
  }

  if (zone.geometry) {
    let inside;
    try {
      inside = await plantingRepository.isPointInZone(
        body.location.lat,
        body.location.lng,
        body.zone_id,
      );
    } catch {
      throw new AppError('Error al validar la ubicación contra la zona de intervención', 500);
    }
    if (!inside) {
      throw new ValidationError([
        { field: 'location', message: 'Las coordenadas no están dentro de la zona de intervención seleccionada' },
      ]);
    }
  }

  const planting = await db.withTransaction(async (client) => {
    const created = await plantingRepository.create(client, {
      zone_id: body.zone_id,
      species_id: body.species_id,
      location: body.location,
      planted_at: body.planted_at,
      initial_ph: body.initial_ph,
      initial_humidity: body.initial_humidity,
      initial_soil_texture: body.initial_soil_texture,
      planted_by: userId,
    });

    await monitoringRepository.create(client, {
      planting_site_id: created.id,
      survival_status: body.initial_survival_status,
      visit_date: body.planted_at || created.planted_at,
      monitored_by: userId,
    });

    return created;
  });

  logger.info({ planting_id: planting.id, zone_id: planting.zone_id, species_id: planting.species_id, initial_status: body.initial_survival_status }, 'Planting site registered');
  return planting;
};

const processItem = async (item, i, zoneMap, speciesMap, userId) => {
  try {
    const validation = validateSyncItem(item);
    if (!validation.valid) {
      return {
        index: i,
        status: 'error',
        error: validation.errors.map((e) => e.message).join('; '),
        fields: validation.errors,
      };
    }
    const clean = validation.data;

    const zone = zoneMap.get(clean.zone_id);
    if (!zone) {
      return { index: i, status: 'error', error: 'Zona de intervención no encontrada' };
    }

    const species = speciesMap.get(clean.species_id);
    if (!species) {
      return { index: i, status: 'error', error: 'Especie no encontrada' };
    }

    if (zone.geometry) {
      let inside;
      try {
        inside = await plantingRepository.isPointInZone(
          clean.location.lat,
          clean.location.lng,
          clean.zone_id,
        );
      } catch {
        return { index: i, status: 'error', error: 'Error al validar la ubicación contra la zona de intervención' };
      }
      if (!inside) {
        return { index: i, status: 'error', error: 'Las coordenadas no están dentro de la zona de intervención' };
      }
    }

    try {
      const planting = await db.withTransaction(async (client) => {
        const upserted = await plantingRepository.upsert(client, { ...clean, planted_by: userId });
        if (clean.initial_survival_status) {
          await monitoringRepository.create(client, {
            planting_site_id: upserted.id,
            survival_status: clean.initial_survival_status,
            visit_date: clean.planted_at || upserted.planted_at,
            monitored_by: userId,
          });
        }
        return upserted;
      });

      const inserted = planting.inserted === true;
      logger.info({ planting_id: planting.id, conflict: !inserted }, 'Planting upserted via sync');
      return {
        index: i,
        status: 'success',
        data: planting,
        ...(inserted ? {} : { conflict: 'resolved' }),
      };
    } catch (err) {
      logger.warn({ err, index: i }, 'Error al procesar ítem del sync en la base de datos');
      return {
        index: i,
        status: 'error',
        error: 'Error al guardar el registro en la base de datos',
      };
    }
  } catch (error) {
    logger.warn({ err: error, index: i }, 'Error inesperado al procesar ítem del sync');
    return {
      index: i,
      status: 'error',
      error: 'Error al procesar el registro',
    };
  }
};

const syncBatch = async (items, userId) => {
  const uniqueZoneIds = [...new Set(items.map((i) => i.zone_id).filter(Boolean))];
  const uniqueSpeciesIds = [...new Set(items.map((i) => i.species_id).filter(Boolean))];

  const [allZones, allSpecies] = await Promise.all([
    zoneRepository.findByIds(uniqueZoneIds),
    speciesRepository.findByIds(uniqueSpeciesIds),
  ]);

  const zoneMap = new Map((allZones || []).map((z) => [z.id, z]));
  const speciesMap = new Map((allSpecies || []).map((s) => [s.id, s]));

  const results = [];

  for (let start = 0; start < items.length; start += CONCURRENCY_LIMIT) {
    const chunk = items.slice(start, start + CONCURRENCY_LIMIT);
    const settled = await Promise.allSettled(
      chunk.map((item, offset) => {
        const index = start + offset;
        return processItem(item, index, zoneMap, speciesMap, userId);
      })
    );

    for (const [offset, result] of settled.entries()) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ index: start + offset, status: 'error', error: 'Error interno al procesar el lote' });
      }
    }
  }

  return results;
};

const getAll = async (page, limit, filters = {}) => {
  const result = await plantingRepository.findAll(page, limit, filters);
  result.rows = await signPhotoRows(result.rows);
  return result;
};

const getById = async (id) => {
  const planting = await plantingRepository.findById(id);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }
  return signPhotoRow(planting);
};

const updatePhotoUrl = async (id, photoUrl) => {
  const updated = await plantingRepository.updatePhotoUrl(id, photoUrl);
  if (!updated) throw new NotFoundError('Plantación no encontrada');
  return signPhotoRow(updated);
};

const getGeoJson = async (filters = {}) => {
  return plantingRepository.findGeoJson(filters);
};

module.exports = { create, getAll, getById, syncBatch, updatePhotoUrl, getGeoJson };
