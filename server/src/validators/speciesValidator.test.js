import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateCreateSpecies, validateUpdateSpecies } = cjsRequire('./speciesValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateCreateSpecies', () => {
  const validData = {
    scientific_name: 'Cedrela odorata',
    common_name: 'Cedro',
    description: 'Árbol de madera fina',
    ideal_soil_type: 'loamy',
    recommended_altitude_min: 500,
    recommended_altitude_max: 2000,
  };

  it('passes with complete valid data', () => {
    const result = validateCreateSpecies(validData);
    expect(result.scientific_name).toBe('Cedrela odorata');
    expect(result.common_name).toBe('Cedro');
    expect(result.recommended_altitude_min).toBe(500);
  });

  it('passes with only required fields', () => {
    const result = validateCreateSpecies({
      scientific_name: 'Pinus radiata',
      common_name: 'Pino',
    });
    expect(result.description).toBeNull();
    expect(result.ideal_soil_type).toBeNull();
    expect(result.recommended_altitude_min).toBeNull();
  });

  it('throws error if scientific_name is empty', () => {
    expect(() => validateCreateSpecies({ ...validData, scientific_name: '' })).toThrow(ValidationError);
  });

  it('throws error if scientific_name exceeds 500 characters', () => {
    expect(() => validateCreateSpecies({ ...validData, scientific_name: 'A'.repeat(501) })).toThrow(ValidationError);
  });

  it('throws error if common_name is empty', () => {
    expect(() => validateCreateSpecies({ ...validData, common_name: '' })).toThrow(ValidationError);
  });

  it('throws error if common_name exceeds 300 characters', () => {
    expect(() => validateCreateSpecies({ ...validData, common_name: 'B'.repeat(301) })).toThrow(ValidationError);
  });

  it('throws error if description exceeds 2000 characters', () => {
    expect(() => validateCreateSpecies({ ...validData, description: 'C'.repeat(2001) })).toThrow(ValidationError);
  });

  it('throws error if ideal_soil_type exceeds 200 characters', () => {
    expect(() => validateCreateSpecies({ ...validData, ideal_soil_type: 'D'.repeat(201) })).toThrow(ValidationError);
  });

  it('throws error if min altitude is not an integer', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_min: 100.5 })).toThrow(ValidationError);
  });

  it('throws error if min altitude is negative', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_min: -1 })).toThrow(ValidationError);
  });

  it('throws error if min altitude exceeds 6000', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_min: 7000 })).toThrow(ValidationError);
  });

  it('throws error if max altitude is less than or equal to min', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_min: 2000, recommended_altitude_max: 1000 })).toThrow(ValidationError);
  });

  it('throws error if scientific_name is not a string', () => {
    expect(() => validateCreateSpecies({ ...validData, scientific_name: 123 })).toThrow(ValidationError);
  });

  it('throws with all accumulated details', () => {
    try {
      validateCreateSpecies({});
    } catch (err) {
      expect(err.details.length).toBeGreaterThanOrEqual(2);
      const fields = err.details.map((d) => d.field);
      expect(fields).toContain('scientific_name');
      expect(fields).toContain('common_name');
    }
  });

  it('trims strings', () => {
    const result = validateCreateSpecies({
      scientific_name: '  Cedrela odorata  ',
      common_name: '  Cedro  ',
    });
    expect(result.scientific_name).toBe('Cedrela odorata');
    expect(result.common_name).toBe('Cedro');
  });

  it('throws error if description is not a string', () => {
    expect(() => validateCreateSpecies({ ...validData, description: 123 })).toThrow(ValidationError);
  });

  it('throws error if ideal_soil_type is not a string', () => {
    expect(() => validateCreateSpecies({ ...validData, ideal_soil_type: 456 })).toThrow(ValidationError);
  });

  it('throws on undefined data', () => {
    expect(() => validateCreateSpecies()).toThrow(ValidationError);
  });

  it('throws on null data', () => {
    expect(() => validateCreateSpecies(null)).toThrow(ValidationError);
  });

  it('throws error if max altitude exceeds 6000', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_max: 7000 })).toThrow(ValidationError);
  });

  it('throws error if max altitude is negative', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_max: -1 })).toThrow(ValidationError);
  });

  it('throws error if max altitude is not an integer', () => {
    expect(() => validateCreateSpecies({ ...validData, recommended_altitude_max: 100.5 })).toThrow(ValidationError);
  });
});

describe('validateUpdateSpecies', () => {
  it('passes with partial fields', () => {
    const result = validateUpdateSpecies({ common_name: 'Cedro rojo' });
    expect(result.common_name).toBe('Cedro rojo');
    expect(result.scientific_name).toBeUndefined();
  });

  it('passes with empty data', () => {
    const result = validateUpdateSpecies({});
    expect(Object.keys(result).length).toBe(0);
  });

  it('throws error if scientific_name is empty string', () => {
    expect(() => validateUpdateSpecies({ scientific_name: '' })).toThrow(ValidationError);
  });

  it('throws error if common_name is empty string', () => {
    expect(() => validateUpdateSpecies({ common_name: '' })).toThrow(ValidationError);
  });

  it('throws error if altitude is invalid on update', () => {
    expect(() => validateUpdateSpecies({ recommended_altitude_min: -5 })).toThrow(ValidationError);
  });

  it('validates altitude range on update', () => {
    expect(() => validateUpdateSpecies({ recommended_altitude_min: 1000, recommended_altitude_max: 500 })).toThrow(ValidationError);
  });

  it('allows clearing optional field with null', () => {
    const result = validateUpdateSpecies({ description: null });
    expect(result.description).toBeNull();
  });

  it('throws error if ideal_soil_type is not a string', () => {
    expect(() => validateUpdateSpecies({ ideal_soil_type: 42 })).toThrow(ValidationError);
  });

  it('throws error if scientific_name is not a string on update', () => {
    expect(() => validateUpdateSpecies({ scientific_name: 123 })).toThrow(ValidationError);
  });

  it('throws error if description is not a string on update', () => {
    expect(() => validateUpdateSpecies({ description: 456 })).toThrow(ValidationError);
  });

  it('throws error if description exceeds 2000 characters on update', () => {
    expect(() => validateUpdateSpecies({ description: 'A'.repeat(2001) })).toThrow(ValidationError);
  });

  it('throws error if ideal_soil_type exceeds 200 characters on update', () => {
    expect(() => validateUpdateSpecies({ ideal_soil_type: 'B'.repeat(201) })).toThrow(ValidationError);
  });

  it('throws error if scientific_name exceeds 500 characters on update', () => {
    expect(() => validateUpdateSpecies({ scientific_name: 'C'.repeat(501) })).toThrow(ValidationError);
  });

  it('throws error if common_name exceeds 300 characters on update', () => {
    expect(() => validateUpdateSpecies({ common_name: 'D'.repeat(301) })).toThrow(ValidationError);
  });

  it('throws error if description exceeds 2000 characters on update', () => {
    expect(() => validateUpdateSpecies({ description: 'E'.repeat(2001) })).toThrow(ValidationError);
  });

  it('throws error if max altitude exceeds 6000 on update', () => {
    expect(() => validateUpdateSpecies({ recommended_altitude_max: 7000 })).toThrow(ValidationError);
  });

  it('throws error if max altitude is negative on update', () => {
    expect(() => validateUpdateSpecies({ recommended_altitude_max: -1 })).toThrow(ValidationError);
  });

  it('throws error if max altitude is not an integer on update', () => {
    expect(() => validateUpdateSpecies({ recommended_altitude_max: 100.5 })).toThrow(ValidationError);
  });

  it('preserves all validated fields in result', () => {
    const result = validateUpdateSpecies({
      scientific_name: 'Pinus radiata',
      common_name: 'Pino',
      description: 'Árbol de madera blanda',
      ideal_soil_type: 'sandy',
      recommended_altitude_min: 500,
      recommended_altitude_max: 2000,
    });
    expect(result.scientific_name).toBe('Pinus radiata');
    expect(result.common_name).toBe('Pino');
    expect(result.description).toBe('Árbol de madera blanda');
    expect(result.ideal_soil_type).toBe('sandy');
    expect(result.recommended_altitude_min).toBe(500);
    expect(result.recommended_altitude_max).toBe(2000);
  });

  it('trims strings in update result', () => {
    const result = validateUpdateSpecies({
      scientific_name: '  Pinus radiata  ',
      description: '  some desc  ',
      ideal_soil_type: '  loamy  ',
    });
    expect(result.scientific_name).toBe('Pinus radiata');
    expect(result.description).toBe('some desc');
    expect(result.ideal_soil_type).toBe('loamy');
  });

  it('handles empty ideal_soil_type in update result', () => {
    const result = validateUpdateSpecies({ ideal_soil_type: '' });
    expect(result.ideal_soil_type).toBeNull();
  });

  it('handles null altitude values in update result', () => {
    const result = validateUpdateSpecies({ recommended_altitude_min: null, recommended_altitude_max: null });
    expect(result.recommended_altitude_min).toBeNull();
    expect(result.recommended_altitude_max).toBeNull();
  });
});
