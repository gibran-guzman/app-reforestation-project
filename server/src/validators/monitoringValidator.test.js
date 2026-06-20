import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateCreateMonitoring } = cjsRequire('./monitoringValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateCreateMonitoring', () => {
  const validData = {
    planting_site_id: 1,
    visit_date: '2026-06-15',
    ph: 6.5,
    humidity: 45,
    soil_texture: 'loamy',
    survival_status: 'alive',
    vigor: 'high',
    notes: 'Planta en buen estado',
  };

  it('passes with complete valid data', () => {
    const result = validateCreateMonitoring(validData);
    expect(result.planting_site_id).toBe(1);
    expect(result.survival_status).toBe('alive');
    expect(result.ph).toBe(6.5);
  });

  it('passes with only required fields', () => {
    const result = validateCreateMonitoring({ planting_site_id: 1, survival_status: 'dead' });
    expect(result.visit_date).toBeDefined();
    expect(result.ph).toBeNull();
    expect(result.humidity).toBeNull();
    expect(result.vigor).toBeNull();
  });

  it('throws error if planting_site_id is missing', () => {
    expect(() => validateCreateMonitoring({ survival_status: 'alive' })).toThrow(ValidationError);
  });

  it('throws error if planting_site_id is not an integer', () => {
    expect(() => validateCreateMonitoring({ planting_site_id: 1.5, survival_status: 'alive' })).toThrow(ValidationError);
  });

  it('throws error if planting_site_id is less than 1', () => {
    expect(() => validateCreateMonitoring({ planting_site_id: 0, survival_status: 'alive' })).toThrow(ValidationError);
  });

  it('throws error if visit_date is invalid', () => {
    expect(() => validateCreateMonitoring({ ...validData, visit_date: 'not-a-date' })).toThrow(ValidationError);
  });

  it('throws error if ph is out of 0-14 range', () => {
    expect(() => validateCreateMonitoring({ ...validData, ph: 15 })).toThrow(ValidationError);
    expect(() => validateCreateMonitoring({ ...validData, ph: -1 })).toThrow(ValidationError);
  });

  it('throws error if humidity is out of 0-100 range', () => {
    expect(() => validateCreateMonitoring({ ...validData, humidity: 101 })).toThrow(ValidationError);
    expect(() => validateCreateMonitoring({ ...validData, humidity: -1 })).toThrow(ValidationError);
  });

  it('throws error if soil_texture is invalid', () => {
    expect(() => validateCreateMonitoring({ ...validData, soil_texture: 'invalid' })).toThrow(ValidationError);
  });

  it('throws error if survival_status is missing', () => {
    expect(() => validateCreateMonitoring({ planting_site_id: 1 })).toThrow(ValidationError);
  });

  it('throws error if survival_status is invalid', () => {
    expect(() => validateCreateMonitoring({ ...validData, survival_status: 'unknown' })).toThrow(ValidationError);
  });

  it('throws error if vigor is invalid', () => {
    expect(() => validateCreateMonitoring({ ...validData, vigor: 'extreme' })).toThrow(ValidationError);
  });

  it('throws error if notes exceeds 2000 characters', () => {
    expect(() => validateCreateMonitoring({ ...validData, notes: 'X'.repeat(2001) })).toThrow(ValidationError);
  });

  it('accepts all valid survival statuses', () => {
    const statuses = ['alive', 'struggling', 'dead'];
    for (const s of statuses) {
      const result = validateCreateMonitoring({ planting_site_id: 1, survival_status: s });
      expect(result.survival_status).toBe(s);
    }
  });

  it('accepts all valid vigor values', () => {
    const vigors = ['high', 'medium', 'low'];
    for (const v of vigors) {
      const result = validateCreateMonitoring({ ...validData, vigor: v });
      expect(result.vigor).toBe(v);
    }
  });

  it('parses ph and humidity to number', () => {
    const result = validateCreateMonitoring({ ...validData, ph: '6.5', humidity: '45' });
    expect(result.ph).toBe(6.5);
    expect(result.humidity).toBe(45);
  });

  it('defaults visit_date to today when not provided', () => {
    const result = validateCreateMonitoring({ planting_site_id: 1, survival_status: 'alive' });
    expect(result.visit_date).toBeDefined();
    expect(result.visit_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('accepts visit_date as null', () => {
    const result = validateCreateMonitoring({ planting_site_id: 1, survival_status: 'alive', visit_date: null });
    expect(result.visit_date).toBeDefined();
  });

  it('accepts photo_url when provided', () => {
    const result = validateCreateMonitoring({ ...validData, photo_url: 'https://example.com/photo.jpg' });
    expect(result.photo_url).toBe('https://example.com/photo.jpg');
  });

  it('defaults photo_url to null', () => {
    const result = validateCreateMonitoring({ planting_site_id: 1, survival_status: 'alive' });
    expect(result.photo_url).toBeNull();
  });

  it('parses ph and humidity when provided as strings', () => {
    const result = validateCreateMonitoring({ ...validData, ph: '7.2', humidity: '80' });
    expect(result.ph).toBe(7.2);
    expect(result.humidity).toBe(80);
  });

  it('throws with all accumulated details', () => {
    try {
      validateCreateMonitoring({});
    } catch (err) {
      expect(err.details.length).toBeGreaterThanOrEqual(1);
      const fields = err.details.map((d) => d.field);
      expect(fields).toContain('planting_site_id');
      expect(fields).toContain('survival_status');
    }
  });
});
