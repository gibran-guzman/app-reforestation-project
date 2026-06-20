const { ValidationError } = require('../errors/AppError');
const { SOIL_TEXTURE_VALUES } = require('../config/constants');
const { validateRange } = require('../utils/validators');

const SURVIVAL_STATUSES = ['alive', 'struggling', 'dead'];
const VIGOR_VALUES = ['high', 'medium', 'low'];

const validateCreateMonitoring = (data) => {
  const errors = [];

  if (!data.planting_site_id || !Number.isInteger(data.planting_site_id) || data.planting_site_id < 1) {
    errors.push({ field: 'planting_site_id', message: 'El ID de plantación es requerido y debe ser un entero positivo' });
  }

  if (data.visit_date !== undefined && data.visit_date !== null) {
    const d = new Date(data.visit_date);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'visit_date', message: 'La fecha de visita debe ser una fecha válida' });
    }
  }

  const phErr = validateRange(data.ph, 'ph', 0, 14, 'El pH');
  if (phErr) errors.push(phErr);

  const humidityErr = validateRange(data.humidity, 'humidity', 0, 100, 'La humedad');
  if (humidityErr) errors.push(humidityErr);

  if (data.soil_texture !== undefined && data.soil_texture !== null) {
    if (!SOIL_TEXTURE_VALUES.includes(data.soil_texture)) {
      errors.push({ field: 'soil_texture', message: `La textura del suelo debe ser uno de: ${SOIL_TEXTURE_VALUES.join(', ')}` });
    }
  }

  if (!data.survival_status || !SURVIVAL_STATUSES.includes(data.survival_status)) {
    errors.push({ field: 'survival_status', message: `El estado de supervivencia es requerido y debe ser uno de: ${SURVIVAL_STATUSES.join(', ')}` });
  }

  if (data.vigor !== undefined && data.vigor !== null) {
    if (!VIGOR_VALUES.includes(data.vigor)) {
      errors.push({ field: 'vigor', message: `El vigor debe ser uno de: ${VIGOR_VALUES.join(', ')}` });
    }
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes === 'string' && data.notes.length > 2000) {
    errors.push({ field: 'notes', message: 'Las notas no deben exceder 2000 caracteres' });
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
