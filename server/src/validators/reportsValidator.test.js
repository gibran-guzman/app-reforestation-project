import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateReportFilters } = cjsRequire('./reportsValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateReportFilters', () => {
  it('passes with no filters', () => {
    expect(() => validateReportFilters({})).not.toThrow();
  });

  it('passes with valid zone_id and species_id', () => {
    expect(() => validateReportFilters({ zone_id: 1, species_id: 5 })).not.toThrow();
  });

  it('throws for invalid zone_id', () => {
    expect(() => validateReportFilters({ zone_id: -1 })).toThrow(ValidationError);
    expect(() => validateReportFilters({ zone_id: 0 })).toThrow(ValidationError);
    expect(() => validateReportFilters({ zone_id: 1.5 })).toThrow(ValidationError);
  });

  it('throws for invalid species_id', () => {
    expect(() => validateReportFilters({ species_id: 'abc' })).toThrow(ValidationError);
  });

  it('passes with valid dates', () => {
    expect(() => validateReportFilters({ from: '2025-01-01', to: '2025-12-31' })).not.toThrow();
  });

  it('throws for invalid date format', () => {
    expect(() => validateReportFilters({ from: 'not-a-date' })).toThrow(ValidationError);
  });

  it('throws when from is after to', () => {
    expect(() => validateReportFilters({ from: '2025-12-31', to: '2025-01-01' })).toThrow(ValidationError);
  });

  it('includes all error details', () => {
    try {
      validateReportFilters({ zone_id: -1, species_id: -1, from: 'bad', to: 'also-bad' });
    } catch (err) {
      expect(err.details.length).toBeGreaterThanOrEqual(3);
    }
  });
});
