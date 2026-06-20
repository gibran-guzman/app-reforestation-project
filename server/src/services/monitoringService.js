const monitoringRepository = require('../repositories/monitoringRepository');
const plantingRepository = require('../repositories/plantingRepository');
const { NotFoundError } = require('../errors/AppError');
const logger = require('../utils/logger');

const create = async (body, userId) => {
  const planting = await plantingRepository.findById(body.planting_site_id);
  if (!planting) {
    throw new NotFoundError('Plantación no encontrada');
  }

  const record = await monitoringRepository.create({
    ...body,
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

  const { rows } = await monitoringRepository.findByPlantingSiteId(plantingSiteId);
  return rows;
};

const getById = async (id) => {
  const record = await monitoringRepository.findById(id);
  if (!record) {
    throw new NotFoundError('Registro de monitoreo no encontrado');
  }
  return record;
};

module.exports = { create, getByPlantingSiteId, getById };
