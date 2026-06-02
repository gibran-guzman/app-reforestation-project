const monitoringRepository = require('../repositories/monitoringRepository');
const plantingRepository = require('../repositories/plantingRepository');
const { validateCreateMonitoring } = require('../validators/monitoringValidator');
const { NotFoundError } = require('../errors/AppError');
const logger = require('../utils/logger');

const create = async (body, userId) => {
  const validatedData = validateCreateMonitoring(body);

  const planting = await plantingRepository.findById(validatedData.planting_site_id);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }

  const record = await monitoringRepository.create({
    ...validatedData,
    monitored_by: userId,
  });

  logger.info({ monitoring_id: record.id, planting_site_id: record.planting_site_id }, 'Monitoring record created');
  return record;
};

const getByPlantingSiteId = async (plantingSiteId) => {
  const planting = await plantingRepository.findById(plantingSiteId);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }

  return monitoringRepository.findByPlantingSiteId(plantingSiteId);
};

const getById = async (id) => {
  const record = await monitoringRepository.findById(id);
  if (!record) {
    throw new NotFoundError('Registro de monitoreo no encontrado');
  }
  return record;
};

module.exports = { create, getByPlantingSiteId, getById };
