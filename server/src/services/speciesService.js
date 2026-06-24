const speciesRepository = require('../repositories/speciesRepository');
const { ConflictError, ValidationError, NotFoundError } = require('../errors/AppError');
const pgCodes = require('../errors/pgCodes');
const logger = require('../utils/logger');

const createSpecies = async (body) => {
  try {
    const species = await speciesRepository.create(body);
    logger.info({ species_id: species.id, scientific_name: species.scientific_name }, 'Species registered');
    return species;
  } catch (error) {
    if (error.code === pgCodes.UNIQUE_VIOLATION) {
      throw new ConflictError('Ya existe una especie con este nombre científico');
    }
    if (error.code === pgCodes.NOT_NULL_VIOLATION) {
      throw new ValidationError([{ field: error.column, message: `El campo ${error.column} no puede estar vacío` }]);
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
  try {
    const updated = await speciesRepository.update(id, body);
    if (!updated) throw new NotFoundError('Especie no encontrada');
    logger.info({ species_id: id }, 'Species updated');
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (error.code === pgCodes.UNIQUE_VIOLATION) {
      throw new ConflictError('Ya existe una especie con este nombre científico');
    }
    if (error.code === pgCodes.NOT_NULL_VIOLATION) {
      throw new ValidationError([{ field: error.column, message: `El campo ${error.column} no puede estar vacío` }]);
    }
    throw error;
  }
};

const remove = async (id) => {
  const deleted = await speciesRepository.remove(id);
  if (!deleted) throw new NotFoundError('Especie no encontrada');
  logger.info({ species_id: id }, 'Species deleted');
};

module.exports = { createSpecies, list, getById, update, remove };
