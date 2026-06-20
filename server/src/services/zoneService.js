const zoneRepository = require('../repositories/zoneRepository');
const { NotFoundError } = require('../errors/AppError');
const logger = require('../utils/logger');

const list = async () => {
  return zoneRepository.findAll();
};

const getById = async (id) => {
  const zone = await zoneRepository.findById(id);
  if (!zone) {
    throw new NotFoundError('Zona de intervención no encontrada');
  }
  return zone;
};

const create = async (body) => {
  const zone = await zoneRepository.create(body);
  logger.info({ zone_id: zone.id, zone_name: zone.name }, 'Intervention zone created');
  return zone;
};

const update = async (id, body) => {
  const zone = await zoneRepository.update(id, body);
  if (!zone) throw new NotFoundError('Zona de intervención no encontrada');
  logger.info({ zone_id: id }, 'Intervention zone updated');
  return zone;
};

const remove = async (id) => {
  const deleted = await zoneRepository.remove(id);
  if (!deleted) throw new NotFoundError('Zona de intervención no encontrada');
  logger.info({ zone_id: id }, 'Intervention zone deleted');
};

module.exports = { list, getById, create, update, remove };
