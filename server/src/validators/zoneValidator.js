const { ValidationError } = require('../errors/AppError');

const validateCreateZone = (data) => {
  const errors = [];
  const { name, description, geometry } = data || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Zone name is required and must be a non-empty string' });
  } else if (name.length > 255) {
    errors.push({ field: 'name', message: 'Zone name must not exceed 255 characters' });
  }

  if (description !== undefined && description !== null && description !== '') {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
    }
  }

  if (!geometry || typeof geometry !== 'object') {
    errors.push({ field: 'geometry', message: 'Geometry is required and must be a valid GeoJSON Polygon' });
  } else {
    if (geometry.type !== 'Polygon') {
      errors.push({ field: 'geometry.type', message: 'Geometry type must be "Polygon"' });
    }
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      errors.push({ field: 'geometry.coordinates', message: 'Geometry coordinates are required' });
    } else {
      const ring = geometry.coordinates[0];
      if (!Array.isArray(ring) || ring.length < 4) {
        errors.push({ field: 'geometry.coordinates', message: 'Polygon must have at least 4 coordinate pairs (first and last must match)' });
      } else {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          errors.push({ field: 'geometry.coordinates', message: 'Polygon ring must be closed (first and last coordinates must match)' });
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : null,
    geometry,
  };
};

const validateUpdateZone = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Zone name must be a non-empty string' });
    } else if (data.name.length > 255) {
      errors.push({ field: 'name', message: 'Zone name must not exceed 255 characters' });
    }
  }

  if (data.description !== undefined && data.description !== null && data.description !== '') {
    if (typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (data.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
    }
  }

  if (data.geometry !== undefined) {
    if (typeof data.geometry !== 'object' || data.geometry.type !== 'Polygon') {
      errors.push({ field: 'geometry', message: 'Geometry must be a valid GeoJSON Polygon' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  const result = {};
  if (data.name !== undefined) result.name = data.name.trim();
  if (data.description !== undefined) result.description = data.description ? data.description.trim() : null;
  if (data.geometry !== undefined) result.geometry = data.geometry;
  return result;
};

module.exports = { validateCreateZone, validateUpdateZone };
