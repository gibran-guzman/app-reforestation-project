import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateCreateZone, validateUpdateZone } = cjsRequire('./zoneValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateCreateZone', () => {
  const validPolygon = {
    type: 'Polygon',
    coordinates: [[
      [-78.531, -0.234],
      [-78.530, -0.234],
      [-78.530, -0.233],
      [-78.531, -0.233],
      [-78.531, -0.234],
    ]],
  };

  const validData = { name: 'Zona Norte', description: 'Bosque protector', geometry: validPolygon };

  it('passes with complete valid data', () => {
    const result = validateCreateZone(validData);
    expect(result.name).toBe('Zona Norte');
    expect(result.geometry.type).toBe('Polygon');
  });

  it('allows creation without geometry', () => {
    const result = validateCreateZone({ name: 'Zona Test' });
    expect(result.name).toBe('Zona Test');
    expect(result.geometry).toBeUndefined();
  });

  it('throws error if name is empty', () => {
    expect(() => validateCreateZone({ ...validData, name: '' })).toThrow(ValidationError);
  });

  it('throws error if name is not a string', () => {
    expect(() => validateCreateZone({ ...validData, name: 123 })).toThrow(ValidationError);
  });

  it('throws error if name exceeds 255 characters', () => {
    expect(() => validateCreateZone({ ...validData, name: 'A'.repeat(256) })).toThrow(ValidationError);
  });

  it('throws error if description is not a string', () => {
    expect(() => validateCreateZone({ ...validData, description: 123 })).toThrow(ValidationError);
  });

  it('throws error if description exceeds 2000 characters', () => {
    expect(() => validateCreateZone({ ...validData, description: 'B'.repeat(2001) })).toThrow(ValidationError);
  });

  it('throws error if geometry is not polygon', () => {
    expect(() => validateCreateZone({ ...validData, geometry: { type: 'Point', coordinates: [0, 0] } })).toThrow(ValidationError);
  });

  it('throws error if geometry is not an object', () => {
    expect(() => validateCreateZone({ ...validData, geometry: 'not-an-object' })).toThrow(ValidationError);
  });

  it('throws error if geometry coordinates is empty', () => {
    expect(() => validateCreateZone({ ...validData, geometry: { type: 'Polygon', coordinates: [] } })).toThrow(ValidationError);
  });

  it('throws error if geometry has fewer than 4 coordinates', () => {
    expect(() => validateCreateZone({ ...validData, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] } })).toThrow(ValidationError);
  });

  it('throws error if polygon is not closed', () => {
    expect(() => validateCreateZone({
      ...validData,
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0.5]]] },
    })).toThrow(ValidationError);
  });

  it('throws with all accumulated details', () => {
    try {
      validateCreateZone({ name: '', description: 'B'.repeat(2001), geometry: { type: 'Point', coordinates: [] } });
    } catch (err) {
      expect(err.details.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('validateUpdateZone', () => {
  const validPolygon = {
    type: 'Polygon',
    coordinates: [[
      [-78.531, -0.234],
      [-78.530, -0.234],
      [-78.530, -0.233],
      [-78.531, -0.233],
      [-78.531, -0.234],
    ]],
  };

  it('passes with partial fields', () => {
    const result = validateUpdateZone({ name: 'Zona Sur Actualizada' });
    expect(result.name).toBe('Zona Sur Actualizada');
  });

  it('passes with empty data', () => {
    const result = validateUpdateZone({});
    expect(Object.keys(result).length).toBe(0);
  });

  it('throws error if name is empty string', () => {
    expect(() => validateUpdateZone({ name: '' })).toThrow(ValidationError);
  });

  it('throws error if name exceeds 255 characters', () => {
    expect(() => validateUpdateZone({ name: 'A'.repeat(256) })).toThrow(ValidationError);
  });

  it('throws error if description is not a string on update', () => {
    expect(() => validateUpdateZone({ description: 123 })).toThrow(ValidationError);
  });

  it('throws error if description exceeds 2000 characters', () => {
    expect(() => validateUpdateZone({ description: 'B'.repeat(2001) })).toThrow(ValidationError);
  });

  it('throws error if geometry is not polygon', () => {
    expect(() => validateUpdateZone({ geometry: { type: 'LineString', coordinates: [] } })).toThrow(ValidationError);
  });

  it('allows updating only geometry', () => {
    const result = validateUpdateZone({ geometry: validPolygon });
    expect(result.geometry.type).toBe('Polygon');
    expect(result.name).toBeUndefined();
  });

  it('throws error if geometry is not an object on update', () => {
    expect(() => validateUpdateZone({ geometry: 'string-geometry' })).toThrow(ValidationError);
  });

  it('throws error if name is not a string on update', () => {
    expect(() => validateUpdateZone({ name: 123 })).toThrow(ValidationError);
  });

  it('handles undefined data gracefully', () => {
    expect(() => validateCreateZone()).toThrow(ValidationError);
  });

  it('trims description when provided on update', () => {
    const result = validateUpdateZone({ description: '  trimmed  ' });
    expect(result.description).toBe('trimmed');
  });

  it('sets description to null when empty string on update', () => {
    const result = validateUpdateZone({ description: '' });
    expect(result.description).toBeNull();
  });
});
