const { validateCreateSpecies } = require('../validators/speciesValidator');
const speciesRepository = require('../repositories/speciesRepository');
const { ConflictError, ValidationError } = require('../errors/AppError');
const logger = require('../utils/logger');

const createSpecies = async (body) => {
  const validatedData = validateCreateSpecies(body);

  try {
    const species = await speciesRepository.create(validatedData);
    logger.info({ species_id: species.id, scientific_name: species.scientific_name }, 'Species registered');
    return {
      message: 'Native species registered successfully',
      data: species,
    };
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('A species with this scientific name already exists');
    }
    if (error.code === '23502') {
      throw new ValidationError([{ field: error.column, message: `Field ${error.column} cannot be null` }]);
    }
    throw error;
  }
};

module.exports = { createSpecies };
