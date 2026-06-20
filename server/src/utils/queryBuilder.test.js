const { buildWhereClause, parseQueryFilters } = require('./queryBuilder');

describe('buildWhereClause', () => {
  it('returns empty WHERE with no filters', () => {
    const result = buildWhereClause({}, 'ps');
    expect(result.where).toBe('');
    expect(result.params).toEqual([]);
    expect(result.conditions).toEqual([]);
  });

  it('builds WHERE with single filter', () => {
    const result = buildWhereClause({ zone_id: 5 }, 'ps');
    expect(result.where).toBe('WHERE ps.zone_id = $1');
    expect(result.params).toEqual([5]);
    expect(result.conditions).toEqual(['ps.zone_id = $1']);
  });

  it('builds WHERE with multiple filters', () => {
    const result = buildWhereClause({ zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31' }, 'ps');
    expect(result.where).toContain('ps.zone_id = $1');
    expect(result.where).toContain('ps.species_id = $2');
    expect(result.where).toContain('ps.planted_at >= $3');
    expect(result.where).toContain('ps.planted_at <= $4');
    expect(result.params).toEqual([1, 2, '2026-01-01', '2026-12-31']);
    expect(result.conditions).toHaveLength(4);
  });

  it('uses no table alias when empty string passed', () => {
    const result = buildWhereClause({ zone_id: 3 }, '');
    expect(result.where).toBe('WHERE zone_id = $1');
  });
});

describe('parseQueryFilters', () => {
  it('parses zone_id and species_id as integers', () => {
    const result = parseQueryFilters({ zone_id: '10', species_id: '20' });
    expect(result).toEqual({ zone_id: 10, species_id: 20 });
  });

  it('parses from and to as strings', () => {
    const result = parseQueryFilters({ from: '2026-01-01', to: '2026-06-30' });
    expect(result).toEqual({ from: '2026-01-01', to: '2026-06-30' });
  });

  it('parses interval', () => {
    const result = parseQueryFilters({ interval: 'month' });
    expect(result).toEqual({ interval: 'month' });
  });

  it('returns empty object when no filters', () => {
    const result = parseQueryFilters({});
    expect(result).toEqual({});
  });

  it('throws 400 for non-numeric zone_id', () => {
    expect(() => parseQueryFilters({ zone_id: 'abc' })).toThrow(/zone_id/);
  });

  it('throws 400 for non-numeric species_id', () => {
    expect(() => parseQueryFilters({ species_id: 'abc' })).toThrow(/species_id/);
  });

  it('throws 400 for invalid from date', () => {
    expect(() => parseQueryFilters({ from: 'not-a-date' })).toThrow(/from/);
  });

  it('throws 400 for invalid to date', () => {
    expect(() => parseQueryFilters({ to: 'not-a-date' })).toThrow(/to/);
  });
});
