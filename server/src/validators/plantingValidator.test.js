const { validateCreatePlanting } = require('./plantingValidator');
const { ValidationError } = require('../errors/AppError');

describe('validateCreatePlanting', () => {
  const validData = {
    zone_id: 1,
    species_id: 2,
    location: { lat: -0.229, lng: -78.524 },
    planted_at: '2026-06-01',
    initial_ph: 6.5,
    initial_humidity: 45,
    initial_soil_texture: 'loamy',
  };

  it('passes valid data', () => {
    const result = validateCreatePlanting(validData);
    expect(result.zone_id).toBe(1);
    expect(result.species_id).toBe(2);
    expect(result.location.lat).toBe(-0.229);
    expect(result.initial_soil_texture).toBe('loamy');
  });

  it('throws on missing zone_id', () => {
    expect(() => validateCreatePlanting({ ...validData, zone_id: null }))
      .toThrow(ValidationError);
  });

  it('throws with details on missing zone_id', () => {
    try {
      validateCreatePlanting({ ...validData, zone_id: null });
    } catch (err) {
      expect(err.details.some(d => d.field === 'zone_id')).toBe(true);
    }
  });

  it('throws on invalid location', () => {
    expect(() => validateCreatePlanting({ ...validData, location: { lat: 100, lng: 0 } }))
      .toThrow(ValidationError);
  });

  it('throws on invalid soil texture', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_soil_texture: 'invalid' }))
      .toThrow(ValidationError);
  });

  it('defaults planted_at to today', () => {
    const result = validateCreatePlanting({ ...validData, planted_at: undefined });
    expect(result.planted_at).toBeDefined();
  });
});
