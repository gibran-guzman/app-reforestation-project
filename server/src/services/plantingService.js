const plantingRepository = require('../repositories/plantingRepository');
const speciesRepository = require('../repositories/speciesRepository');
const zoneRepository = require('../repositories/zoneRepository');
const { validateCreatePlanting } = require('../validators/plantingValidator');
const { NotFoundError, ValidationError } = require('../errors/AppError');
const logger = require('../utils/logger');

const create = async (body, userId) => {
  const validatedData = validateCreatePlanting(body);

  const zone = await zoneRepository.findById(validatedData.zone_id);
  if (!zone) {
    throw new NotFoundError('Zona de intervención no encontrada');
  }

  const species = await speciesRepository.findById(validatedData.species_id);
  if (!species) {
    throw new NotFoundError('Especie no encontrada');
  }

  const inside = await plantingRepository.isPointInZone(
    validatedData.location.lat,
    validatedData.location.lng,
    validatedData.zone_id,
  );
  if (!inside) {
    throw new ValidationError([
      { field: 'location', message: 'Las coordenadas no están dentro de la zona de intervención seleccionada' },
    ]);
  }

  const planting = await plantingRepository.create({
    ...validatedData,
    planted_by: userId,
  });

  logger.info({ planting_id: planting.id, zone_id: planting.zone_id, species_id: planting.species_id }, 'Planting site registered');
  return planting;
};

const syncBatch = async (items, userId) => {
  const uniqueZoneIds = [...new Set(items.map((i) => i.zone_id).filter(Boolean))];
  const uniqueSpeciesIds = [...new Set(items.map((i) => i.species_id).filter(Boolean))];

  const [allZones, allSpecies] = await Promise.all([
    Promise.all(uniqueZoneIds.map((id) => zoneRepository.findById(id))),
    Promise.all(uniqueSpeciesIds.map((id) => speciesRepository.findById(id))),
  ]);

  const zoneMap = new Map(allZones.filter(Boolean).map((z) => [z.id, z]));
  const speciesMap = new Map(allSpecies.filter(Boolean).map((s) => [s.id, s]));

  const results = [];
  const pending = items.map(async (item, i) => {
    try {
      const validatedData = validateCreatePlanting(item);

      const zone = zoneMap.get(validatedData.zone_id);
      if (!zone) {
        return { index: i, status: 'error', error: 'Zona de intervención no encontrada' };
      }

      const species = speciesMap.get(validatedData.species_id);
      if (!species) {
        return { index: i, status: 'error', error: 'Especie no encontrada' };
      }

      const inside = await plantingRepository.isPointInZone(
        validatedData.location.lat,
        validatedData.location.lng,
        validatedData.zone_id,
      );
      if (!inside) {
        return { index: i, status: 'error', error: 'Las coordenadas no están dentro de la zona de intervención' };
      }

      const existing = await plantingRepository.findByConflictKey(
        validatedData.zone_id,
        validatedData.species_id,
        validatedData.planted_at,
        userId,
      );

      if (existing) {
        const updated = await plantingRepository.update(existing.id, { ...validatedData });
        logger.info({ planting_id: updated.id }, 'Planting updated via sync (last writer wins)');
        return { index: i, status: 'success', data: updated, conflict: 'resolved' };
      } else {
        const planting = await plantingRepository.create({ ...validatedData, planted_by: userId });
        logger.info({ planting_id: planting.id }, 'Planting created via sync');
        return { index: i, status: 'success', data: planting };
      }
    } catch (error) {
      return {
        index: i,
        status: 'error',
        error: error.message || 'Error al procesar el registro',
      };
    }
  });

  const settled = await Promise.allSettled(pending);
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({ index: results.length, status: 'error', error: 'Error interno al procesar el lote' });
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
  await getById(id);
  return plantingRepository.updatePhotoUrl(id, photoUrl);
};

module.exports = { create, getAll, getById, syncBatch, updatePhotoUrl };
