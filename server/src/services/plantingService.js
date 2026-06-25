const plantingRepository = require('../repositories/plantingRepository');
const speciesRepository = require('../repositories/speciesRepository');
const zoneRepository = require('../repositories/zoneRepository');
const { AppError, NotFoundError, ValidationError } = require('../errors/AppError');
const pgCodes = require('../errors/pgCodes');
const logger = require('../utils/logger');
const { CONCURRENCY_LIMIT } = require('../config/constants');

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

  const planting = await plantingRepository.create({
    ...body,
    planted_by: userId,
  });

  logger.info({ planting_id: planting.id, zone_id: planting.zone_id, species_id: planting.species_id }, 'Planting site registered');
  return planting;
};

const processItem = async (item, i, zoneMap, speciesMap, userId) => {
  try {
    const zone = zoneMap.get(item.zone_id);
    if (!zone) {
      return { index: i, status: 'error', error: 'Zona de intervención no encontrada' };
    }

    const species = speciesMap.get(item.species_id);
    if (!species) {
      return { index: i, status: 'error', error: 'Especie no encontrada' };
    }

    if (zone.geometry) {
      let inside;
      try {
        inside = await plantingRepository.isPointInZone(
          item.location.lat,
          item.location.lng,
          item.zone_id,
        );
      } catch {
        return { index: i, status: 'error', error: 'Error al validar la ubicación contra la zona de intervención' };
      }
      if (!inside) {
        return { index: i, status: 'error', error: 'Las coordenadas no están dentro de la zona de intervención' };
      }
    }

    try {
      const planting = await plantingRepository.create({ ...item, planted_by: userId });
      logger.info({ planting_id: planting.id }, 'Planting created via sync');
      return { index: i, status: 'success', data: planting };
    } catch (err) {
      if (err.code === pgCodes.UNIQUE_VIOLATION) {
        const existing = await plantingRepository.findByConflictKey(
          item.zone_id,
          item.species_id,
          item.planted_at,
          userId,
        );
        if (!existing || existing.planted_by !== userId) {
          return { index: i, status: 'error', error: 'El registro en conflicto pertenece a otro usuario' };
        }
        const updated = await plantingRepository.update(existing.id, { ...item });
        logger.info({ planting_id: updated.id }, 'Planting updated via sync (last writer wins)');
        return { index: i, status: 'success', data: updated, conflict: 'resolved' };
      }
      throw err;
    }
  } catch (error) {
    return {
      index: i,
      status: 'error',
      error: error?.message || (typeof error === 'string' ? error : 'Error al procesar el registro'),
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
  return plantingRepository.findAll(page, limit, filters);
};

const getById = async (id) => {
  const planting = await plantingRepository.findById(id);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }
  return planting;
};

const updatePhotoUrl = async (id, photoUrl) => {
  const updated = await plantingRepository.updatePhotoUrl(id, photoUrl);
  if (!updated) throw new NotFoundError('Plantación no encontrada');
  return updated;
};

const getGeoJson = async (filters = {}) => {
  return plantingRepository.findGeoJson(filters);
};

module.exports = { create, getAll, getById, syncBatch, updatePhotoUrl, getGeoJson };
