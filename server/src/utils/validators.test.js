import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const { validateRange } = cjsRequire('./validators');

describe('validateRange', () => {
  it('returns null for a valid value within range', () => {
    expect(validateRange(5, 'ph', 0, 14, 'pH')).toBeNull();
  });

  it('returns null for a value at the minimum boundary', () => {
    expect(validateRange(0, 'ph', 0, 14, 'pH')).toBeNull();
  });

  it('returns null for a value at the maximum boundary', () => {
    expect(validateRange(14, 'ph', 0, 14, 'pH')).toBeNull();
  });

  it('returns null when value is undefined', () => {
    expect(validateRange(undefined, 'ph', 0, 14, 'pH')).toBeNull();
  });

  it('returns null when value is null', () => {
    expect(validateRange(null, 'ph', 0, 14, 'pH')).toBeNull();
  });

  it('returns an error when value is below minimum', () => {
    const result = validateRange(-1, 'ph', 0, 14, 'pH');
    expect(result).toEqual({
      field: 'ph',
      message: 'pH debe estar entre 0 y 14',
    });
  });

  it('returns an error when value is above maximum', () => {
    const result = validateRange(15, 'ph', 0, 14, 'pH');
    expect(result).toEqual({
      field: 'ph',
      message: 'pH debe estar entre 0 y 14',
    });
  });

  it('returns an error when value is NaN', () => {
    const result = validateRange('abc', 'humidity', 0, 100, 'Humedad');
    expect(result).toEqual({
      field: 'humidity',
      message: 'Humedad debe estar entre 0 y 100',
    });
  });

  it('uses the provided field name and label in error message', () => {
    const result = validateRange(200, 'humedad', 0, 100, 'Humedad');
    expect(result).toEqual({
      field: 'humedad',
      message: 'Humedad debe estar entre 0 y 100',
    });
  });
});
