const { ValidationError } = require('../errors/AppError');

const validateAltitude = (value, field) => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (!Number.isInteger(num)) return { field, message: `${field} must be an integer` };
  if (num < 0) return { field, message: `${field} must be a positive number` };
  if (num > 6000) return { field, message: `${field} must not exceed 6000 m` };
  return null;
};

const validateCreateSpecies = (data) => {
  const errors = [];
  const { scientific_name, common_name, description, ideal_soil_type, recommended_altitude_min, recommended_altitude_max } = data || {};

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

  const altMinErr = validateAltitude(recommended_altitude_min, 'recommended_altitude_min');
  if (altMinErr) errors.push(altMinErr);

  const altMaxErr = validateAltitude(recommended_altitude_max, 'recommended_altitude_max');
  if (altMaxErr) errors.push(altMaxErr);

  if (recommended_altitude_min !== undefined && recommended_altitude_min !== null &&
      recommended_altitude_max !== undefined && recommended_altitude_max !== null &&
      Number(recommended_altitude_min) >= Number(recommended_altitude_max)) {
    errors.push({ field: 'recommended_altitude_max', message: 'Max altitude must be greater than min altitude' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    scientific_name: scientific_name.trim(),
    common_name: common_name.trim(),
    description: description && typeof description === 'string' ? description.trim() : null,
    ideal_soil_type: ideal_soil_type && typeof ideal_soil_type === 'string' ? ideal_soil_type.trim() : null,
    recommended_altitude_min: recommended_altitude_min != null ? Number(recommended_altitude_min) : null,
    recommended_altitude_max: recommended_altitude_max != null ? Number(recommended_altitude_max) : null,
  };
};

const validateUpdateSpecies = (data) => {
  const errors = [];

  if (data.scientific_name !== undefined) {
    if (typeof data.scientific_name !== 'string' || data.scientific_name.trim().length === 0) {
      errors.push({ field: 'scientific_name', message: 'Scientific name must be a non-empty string' });
    } else if (data.scientific_name.length > 500) {
      errors.push({ field: 'scientific_name', message: 'Scientific name must not exceed 500 characters' });
    }
  }

  if (data.common_name !== undefined) {
    if (typeof data.common_name !== 'string' || data.common_name.trim().length === 0) {
      errors.push({ field: 'common_name', message: 'Common name must be a non-empty string' });
    } else if (data.common_name.length > 300) {
      errors.push({ field: 'common_name', message: 'Common name must not exceed 300 characters' });
    }
  }

  if (data.description !== undefined && data.description !== null && data.description !== '') {
    if (typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (data.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
    }
  }

  if (data.ideal_soil_type !== undefined && data.ideal_soil_type !== null && data.ideal_soil_type !== '') {
    if (typeof data.ideal_soil_type !== 'string') {
      errors.push({ field: 'ideal_soil_type', message: 'Ideal soil type must be a string' });
    } else if (data.ideal_soil_type.length > 200) {
      errors.push({ field: 'ideal_soil_type', message: 'Ideal soil type must not exceed 200 characters' });
    }
  }

  const altMinErr = validateAltitude(data.recommended_altitude_min, 'recommended_altitude_min');
  if (altMinErr) errors.push(altMinErr);

  const altMaxErr = validateAltitude(data.recommended_altitude_max, 'recommended_altitude_max');
  if (altMaxErr) errors.push(altMaxErr);

  if (data.recommended_altitude_min !== undefined && data.recommended_altitude_min !== null &&
      data.recommended_altitude_max !== undefined && data.recommended_altitude_max !== null &&
      Number(data.recommended_altitude_min) >= Number(data.recommended_altitude_max)) {
    errors.push({ field: 'recommended_altitude_max', message: 'Max altitude must be greater than min altitude' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  const result = {};
  if (data.scientific_name !== undefined) result.scientific_name = data.scientific_name.trim();
  if (data.common_name !== undefined) result.common_name = data.common_name.trim();
  if (data.description !== undefined) result.description = data.description ? data.description.trim() : null;
  if (data.ideal_soil_type !== undefined) result.ideal_soil_type = data.ideal_soil_type ? data.ideal_soil_type.trim() : null;
  if (data.recommended_altitude_min !== undefined) result.recommended_altitude_min = data.recommended_altitude_min != null ? Number(data.recommended_altitude_min) : null;
  if (data.recommended_altitude_max !== undefined) result.recommended_altitude_max = data.recommended_altitude_max != null ? Number(data.recommended_altitude_max) : null;
  return result;
};

module.exports = { validateCreateSpecies, validateUpdateSpecies };
