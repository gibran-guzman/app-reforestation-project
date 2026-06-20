import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const parseId = cjsRequire('./parseId');
const { AppError } = cjsRequire('../errors/AppError');

describe('parseId', () => {
  it('parses a valid numeric string', () => {
    expect(parseId('42')).toBe(42);
  });

  it('parses "1" as 1', () => {
    expect(parseId('1')).toBe(1);
  });

  it('throws AppError for non-numeric string', () => {
    expect(() => parseId('abc')).toThrow(AppError);
  });

  it('throws AppError for negative number', () => {
    expect(() => parseId('-5')).toThrow(AppError);
  });

  it('throws AppError for zero', () => {
    expect(() => parseId('0')).toThrow(AppError);
  });

  it('throws AppError for empty string', () => {
    expect(() => parseId('')).toThrow(AppError);
  });

  it('throws AppError for float string', () => {
    expect(() => parseId('3.14')).toThrow(AppError);
  });
});
