import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const pgCodes = cjsRequire('./pgCodes');

describe('pgCodes', () => {
  it('exports UNIQUE_VIOLATION code', () => {
    expect(pgCodes.UNIQUE_VIOLATION).toBe('23505');
  });

  it('exports NOT_NULL_VIOLATION code', () => {
    expect(pgCodes.NOT_NULL_VIOLATION).toBe('23502');
  });

  it('exports INVALID_INPUT_SYNTAX code', () => {
    expect(pgCodes.INVALID_INPUT_SYNTAX).toBe('22P02');
  });
});
