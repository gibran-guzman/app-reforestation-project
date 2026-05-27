const zoneRepository = require('../repositories/zoneRepository');
const { validateCreateZone, validateUpdateZone } = require('../validators/zoneValidator');
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
  const validatedData = validateCreateZone(body);
  const zone = await zoneRepository.create(validatedData);
  logger.info({ zone_id: zone.id, zone_name: zone.name }, 'Intervention zone created');
  return zone;
};

const update = async (id, body) => {
  await getById(id);
  const validatedData = validateUpdateZone(body);
  const zone = await zoneRepository.update(id, validatedData);
  logger.info({ zone_id: id }, 'Intervention zone updated');
  return zone;
};

const remove = async (id) => {
  await getById(id);
  await zoneRepository.remove(id);
  logger.info({ zone_id: id }, 'Intervention zone deleted');
};

module.exports = { list, getById, create, update, remove };
