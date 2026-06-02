const { ValidationError } = require('../errors/AppError');
const { SOIL_TEXTURE_VALUES } = require('../config/constants');

const SURVIVAL_STATUSES = ['alive', 'struggling', 'dead'];
const VIGOR_VALUES = ['high', 'medium', 'low'];

const validateCreateMonitoring = (data) => {
  const errors = [];

  if (!data.planting_site_id || !Number.isInteger(data.planting_site_id) || data.planting_site_id < 1) {
    errors.push({ field: 'planting_site_id', message: 'planting_site_id is required and must be a positive integer' });
  }

  if (data.visit_date !== undefined && data.visit_date !== null) {
    const d = new Date(data.visit_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'visit_date', message: 'visit_date must be a valid date' });
    }
  }

  if (data.ph !== undefined && data.ph !== null) {
    const ph = Number(data.ph);
    if (isNaN(ph) || ph < 0 || ph > 14) {
      errors.push({ field: 'ph', message: 'ph must be a number between 0 and 14' });
    }
  }

  if (data.humidity !== undefined && data.humidity !== null) {
    const h = Number(data.humidity);
    if (isNaN(h) || h < 0 || h > 100) {
      errors.push({ field: 'humidity', message: 'humidity must be a number between 0 and 100' });
    }
  }

  if (data.soil_texture !== undefined && data.soil_texture !== null) {
    if (!SOIL_TEXTURE_VALUES.includes(data.soil_texture)) {
      errors.push({ field: 'soil_texture', message: `soil_texture must be one of: ${SOIL_TEXTURE_VALUES.join(', ')}` });
    }
  }

  if (!data.survival_status || !SURVIVAL_STATUSES.includes(data.survival_status)) {
    errors.push({ field: 'survival_status', message: `survival_status is required and must be one of: ${SURVIVAL_STATUSES.join(', ')}` });
  }

  if (data.vigor !== undefined && data.vigor !== null) {
    if (!VIGOR_VALUES.includes(data.vigor)) {
      errors.push({ field: 'vigor', message: `vigor must be one of: ${VIGOR_VALUES.join(', ')}` });
    }
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes === 'string' && data.notes.length > 2000) {
    errors.push({ field: 'notes', message: 'notes must not exceed 2000 characters' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    planting_site_id: data.planting_site_id,
    visit_date: data.visit_date || new Date().toISOString().split('T')[0],
    ph: data.ph != null ? Number(data.ph) : null,
    humidity: data.humidity != null ? Number(data.humidity) : null,
    soil_texture: data.soil_texture || null,
    survival_status: data.survival_status,
    vigor: data.vigor || null,
    notes: data.notes || null,
    photo_url: data.photo_url || null,
  };
};

module.exports = { validateCreateMonitoring };
