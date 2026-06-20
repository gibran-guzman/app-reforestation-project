const { ValidationError } = require('../errors/AppError');
const { MAX_ZONE_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } = require('../config/constants');

const validateCreateZone = (data) => {
  const errors = [];
  const { name, description, geometry } = data || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre de la zona es requerido y debe ser un texto no vacío' });
  } else if (name.length > MAX_ZONE_NAME_LENGTH) {
    errors.push({ field: 'name', message: `El nombre de la zona no debe exceder ${MAX_ZONE_NAME_LENGTH} caracteres` });
  }

  if (description !== undefined && description !== null && description !== '') {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'La descripción debe ser un texto' });
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({ field: 'description', message: `La descripción no debe exceder ${MAX_DESCRIPTION_LENGTH} caracteres` });
    }
  }

  if (!geometry) {
    errors.push({ field: 'geometry', message: 'La geometría de la zona es requerida' });
  } else if (typeof geometry !== 'object') {
    errors.push({ field: 'geometry', message: 'La geometría debe ser un GeoJSON Polygon válido' });
  } else if (geometry.type !== 'Polygon') {
    errors.push({ field: 'geometry.type', message: 'El tipo de geometría debe ser "Polygon"' });
  } else if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    errors.push({ field: 'geometry.coordinates', message: 'Las coordenadas de la geometría son requeridas' });
  } else {
    const ring = geometry.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      errors.push({ field: 'geometry.coordinates', message: 'El polígono debe tener al menos 4 pares de coordenadas (el primero y el último deben coincidir)' });
    } else {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        errors.push({ field: 'geometry.coordinates', message: 'El anillo del polígono debe estar cerrado (la primera y última coordenada deben coincidir)' });
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
      errors.push({ field: 'name', message: 'El nombre de la zona debe ser un texto no vacío' });
    } else if (data.name.length > MAX_ZONE_NAME_LENGTH) {
      errors.push({ field: 'name', message: `El nombre de la zona no debe exceder ${MAX_ZONE_NAME_LENGTH} caracteres` });
    }
  }

  if (data.description !== undefined && data.description !== null && data.description !== '') {
    if (typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'La descripción debe ser un texto' });
    } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({ field: 'description', message: `La descripción no debe exceder ${MAX_DESCRIPTION_LENGTH} caracteres` });
    }
  }

  if (data.geometry !== undefined) {
    if (typeof data.geometry !== 'object' || data.geometry.type !== 'Polygon') {
      errors.push({ field: 'geometry', message: 'La geometría debe ser un GeoJSON Polygon válido' });
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
