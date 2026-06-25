const { ValidationError } = require('../errors/AppError');
const { SOIL_TEXTURE_VALUES, SURVIVAL_STATUS_VALUES } = require('../config/constants');
const { validateRange } = require('../utils/validators');

const validateCreatePlanting = (data) => {
  const errors = [];
  const { zone_id, species_id, location, planted_at, initial_ph, initial_humidity, initial_soil_texture, initial_survival_status } = data || {};

  if (!zone_id || typeof zone_id !== 'number' || !Number.isInteger(zone_id) || zone_id < 1) {
    errors.push({ field: 'zone_id', message: 'La zona de intervención es requerida y debe ser un ID válido' });
  }

  if (!species_id || typeof species_id !== 'number' || !Number.isInteger(species_id) || species_id < 1) {
    errors.push({ field: 'species_id', message: 'La especie es requerida y debe ser un ID válido' });
  }

  if (!location || typeof location !== 'object') {
    errors.push({ field: 'location', message: 'La ubicación es requerida' });
  } else {
    if (location.lat == null || typeof location.lat !== 'number') {
      errors.push({ field: 'location.lat', message: 'La latitud es requerida y debe ser un número' });
    } else if (location.lat < -90 || location.lat > 90) {
      errors.push({ field: 'location.lat', message: 'La latitud debe estar entre -90 y 90' });
    }

    if (location.lng == null || typeof location.lng !== 'number') {
      errors.push({ field: 'location.lng', message: 'La longitud es requerida y debe ser un número' });
    } else if (location.lng < -180 || location.lng > 180) {
      errors.push({ field: 'location.lng', message: 'La longitud debe estar entre -180 y 180' });
    }
  }

  if (planted_at !== undefined && planted_at !== null) {
    const date = new Date(planted_at);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'planted_at', message: 'La fecha de siembra no es válida' });
    }
  }

  const phErr = validateRange(initial_ph, 'initial_ph', 0, 14, 'El pH');
  if (phErr) errors.push(phErr);

  const humidityErr = validateRange(initial_humidity, 'initial_humidity', 0, 100, 'La humedad');
  if (humidityErr) errors.push(humidityErr);

  if (initial_soil_texture !== undefined && initial_soil_texture !== null && initial_soil_texture !== '') {
    if (!SOIL_TEXTURE_VALUES.includes(initial_soil_texture)) {
      errors.push({ field: 'initial_soil_texture', message: `La textura del suelo debe ser uno de: ${SOIL_TEXTURE_VALUES.join(', ')}` });
    }
  }

  if (!initial_survival_status || !SURVIVAL_STATUS_VALUES.includes(initial_survival_status)) {
    errors.push({ field: 'initial_survival_status', message: 'El estado inicial es requerido y debe ser: viva, estresada o muerta' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    zone_id,
    species_id,
    location: { lat: location.lat, lng: location.lng },
    planted_at: planted_at || new Date().toISOString().split('T')[0],
    initial_ph: initial_ph != null ? Number(initial_ph) : null,
    initial_humidity: initial_humidity != null ? Number(initial_humidity) : null,
    initial_soil_texture: initial_soil_texture || null,
    initial_survival_status,
  };
};

module.exports = { validateCreatePlanting };
