const { validateCreateSpecies, validateUpdateSpecies } = require('../validators/speciesValidator');
const speciesRepository = require('../repositories/speciesRepository');
const { ConflictError, ValidationError, NotFoundError } = require('../errors/AppError');
const logger = require('../utils/logger');

const createSpecies = async (body) => {
  const validatedData = validateCreateSpecies(body);

  try {
    const species = await speciesRepository.create(validatedData);
    logger.info({ species_id: species.id, scientific_name: species.scientific_name }, 'Species registered');
    return {
      message: 'Especie registrada correctamente',
      data: species,
    };
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('Ya existe una especie con este nombre científico');
    }
    if (error.code === '23502') {
      throw new ValidationError([{ field: error.column, message: `Field ${error.column} cannot be null` }]);
    }
    throw error;
  }
};

const list = async () => {
  return speciesRepository.findAll();
};

const getById = async (id) => {
  const species = await speciesRepository.findById(id);
  if (!species) throw new NotFoundError('Especie no encontrada');
  return species;
};

const update = async (id, body) => {
  await getById(id);
  const validatedData = validateUpdateSpecies(body);
  const updated = await speciesRepository.update(id, validatedData);
  logger.info({ species_id: id }, 'Species updated');
  return updated;
};

const remove = async (id) => {
  await getById(id);
  await speciesRepository.remove(id);
  logger.info({ species_id: id }, 'Species deleted');
};

module.exports = { createSpecies, list, getById, update, remove };
