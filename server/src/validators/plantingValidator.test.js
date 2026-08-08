import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateCreatePlanting } = cjsRequire('./plantingValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateCreatePlanting', () => {
  const validData = {
    zone_id: 1,
    species_id: 2,
    location: { lat: -0.229, lng: -78.524 },
    planted_at: '2026-06-01',
    initial_ph: 6.5,
    initial_humidity: 45,
    initial_soil_texture: 'loamy',
    initial_survival_status: 'alive',
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

  it('defaults initial_ph to null when not provided', () => {
    const result = validateCreatePlanting({ ...validData, initial_ph: undefined });
    expect(result.initial_ph).toBeNull();
  });

  it('defaults initial_humidity to null when not provided', () => {
    const result = validateCreatePlanting({ ...validData, initial_humidity: undefined });
    expect(result.initial_humidity).toBeNull();
  });

  it('defaults initial_soil_texture to null when not provided', () => {
    const result = validateCreatePlanting({ ...validData, initial_soil_texture: undefined });
    expect(result.initial_soil_texture).toBeNull();
  });

  it('throws on zone_id = 0 (falsy)', () => {
    expect(() => validateCreatePlanting({ ...validData, zone_id: 0 })).toThrow(ValidationError);
  });

  it('throws on species_id = 0 (falsy)', () => {
    expect(() => validateCreatePlanting({ ...validData, species_id: 0 })).toThrow(ValidationError);
  });

  it('throws on missing location.lat', () => {
    expect(() => validateCreatePlanting({ ...validData, location: { lng: -78.524 } })).toThrow(ValidationError);
  });

  it('throws on missing location.lng', () => {
    expect(() => validateCreatePlanting({ ...validData, location: { lat: -0.229 } })).toThrow(ValidationError);
  });

  it('throws on location.lat out of range', () => {
    expect(() => validateCreatePlanting({ ...validData, location: { lat: -91, lng: -78.524 } })).toThrow(ValidationError);
  });

  it('throws on location.lng out of range', () => {
    expect(() => validateCreatePlanting({ ...validData, location: { lat: -0.229, lng: 200 } })).toThrow(ValidationError);
  });

  it('throws on invalid planted_at date', () => {
    expect(() => validateCreatePlanting({ ...validData, planted_at: 'not-a-date' })).toThrow(ValidationError);
  });

  it('throws on initial_ph out of range', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_ph: 20 })).toThrow(ValidationError);
  });

  it('throws on initial_humidity out of range', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_humidity: 150 })).toThrow(ValidationError);
  });

  it('throws on undefined data', () => {
    expect(() => validateCreatePlanting()).toThrow(ValidationError);
  });

  it('throws on null data', () => {
    expect(() => validateCreatePlanting(null)).toThrow(ValidationError);
  });

  it('passes with struggling survival status', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_survival_status: 'struggling' })).not.toThrow();
  });

  it('passes with dead survival status', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_survival_status: 'dead' })).not.toThrow();
  });

  it('throws on missing initial_survival_status', () => {
    const rest = { ...validData };
    delete rest.initial_survival_status;
    expect(() => validateCreatePlanting(rest)).toThrow(ValidationError);
  });

  it('throws on invalid initial_survival_status', () => {
    expect(() => validateCreatePlanting({ ...validData, initial_survival_status: 'unknown' })).toThrow(ValidationError);
  });

  it('returns initial_survival_status in result', () => {
    const result = validateCreatePlanting(validData);
    expect(result.initial_survival_status).toBe('alive');
  });
});
