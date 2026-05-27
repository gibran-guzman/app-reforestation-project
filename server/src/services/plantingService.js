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

const getAll = async () => {
  return plantingRepository.findAll();
};

const getById = async (id) => {
  const planting = await plantingRepository.findById(id);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }
  return planting;
};

module.exports = { create, getAll, getById };
