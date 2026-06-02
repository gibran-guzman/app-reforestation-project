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
  const results = [];
  for (let i = 0; i < items.length; i++) {
    try {
      const item = items[i];
      const validatedData = validateCreatePlanting(item);

      const zone = await zoneRepository.findById(validatedData.zone_id);
      if (!zone) {
        results.push({ index: i, status: 'error', error: 'Zona de intervención no encontrada' });
        continue;
      }

      const species = await speciesRepository.findById(validatedData.species_id);
      if (!species) {
        results.push({ index: i, status: 'error', error: 'Especie no encontrada' });
        continue;
      }

      const inside = await plantingRepository.isPointInZone(
        validatedData.location.lat,
        validatedData.location.lng,
        validatedData.zone_id,
      );
      if (!inside) {
        results.push({ index: i, status: 'error', error: 'Las coordenadas no están dentro de la zona de intervención' });
        continue;
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
        results.push({ index: i, status: 'success', data: updated, conflict: 'resolved' });
      } else {
        const planting = await plantingRepository.create({ ...validatedData, planted_by: userId });
        logger.info({ planting_id: planting.id }, 'Planting created via sync');
        results.push({ index: i, status: 'success', data: planting });
      }
    } catch (error) {
      results.push({
        index: i,
        status: 'error',
        error: error.message || 'Error al procesar el registro',
      });
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

module.exports = { create, getAll, getById, syncBatch };
