const { ValidationError } = require('../errors/AppError');

const validateCreateSpecies = (data) => {
  const errors = [];
  const { scientific_name, common_name, description, ideal_soil_type } = data || {};

  if (!scientific_name || typeof scientific_name !== 'string' || scientific_name.trim().length === 0) {
    errors.push({ field: 'scientific_name', message: 'Scientific name is required and must be a non-empty string' });
  } else if (scientific_name.length > 500) {
    errors.push({ field: 'scientific_name', message: 'Scientific name must not exceed 500 characters' });
  }

  if (!common_name || typeof common_name !== 'string' || common_name.trim().length === 0) {
    errors.push({ field: 'common_name', message: 'Common name is required and must be a non-empty string' });
  } else if (common_name.length > 300) {
    errors.push({ field: 'common_name', message: 'Common name must not exceed 300 characters' });
  }

  if (description !== undefined && description !== null && description !== '') {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
    }
  }

  if (ideal_soil_type !== undefined && ideal_soil_type !== null && ideal_soil_type !== '') {
    if (typeof ideal_soil_type !== 'string') {
      errors.push({ field: 'ideal_soil_type', message: 'Ideal soil type must be a string' });
    } else if (ideal_soil_type.length > 200) {
      errors.push({ field: 'ideal_soil_type', message: 'Ideal soil type must not exceed 200 characters' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    scientific_name: scientific_name.trim(),
    common_name: common_name.trim(),
    description: description && typeof description === 'string' ? description.trim() : null,
    ideal_soil_type: ideal_soil_type && typeof ideal_soil_type === 'string' ? ideal_soil_type.trim() : null,
  };
};

module.exports = { validateCreateSpecies };
