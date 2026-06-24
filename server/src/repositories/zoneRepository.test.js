import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const mockCache = { get: vi.fn(), set: vi.fn(), invalidate: vi.fn(), invalidateAll: vi.fn() };
const zoneRepository = proxyquire('./zoneRepository', {
  '../config/db': mockDb,
  '../utils/memoryCache': vi.fn(() => mockCache),
});

const fakeRow = {
  id: 1, name: 'Zone A', description: 'Northern sector', geometry: { type: 'Polygon', coordinates: [] }, created_at: new Date(), updated_at: new Date(),
};

describe('zoneRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all zones ordered by name', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockDb.query.mockResolvedValue({ rows: [fakeRow, { ...fakeRow, id: 2, name: 'Zone B' }] });

      const result = await zoneRepository.findAll();

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name'),
      );
    });

    it('returns empty array when no zones', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('returns zones matching given ids', async () => {
      const rows = [fakeRow, { ...fakeRow, id: 2, name: 'Zone B' }];
      mockDb.query.mockResolvedValue({ rows });

      const result = await zoneRepository.findByIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Zone A');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN ($1,$2)'),
        [1, 2],
      );
    });

    it('returns empty array for empty ids list', async () => {
      const result = await zoneRepository.findByIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns the zone when found', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await zoneRepository.findById(1);

      expect(result).toEqual(fakeRow);
    });

    it('returns null when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('inserts and returns the created zone with provided geometry', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const data = { name: 'Zone A', description: 'Northern sector', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } };
      const result = await zoneRepository.create(data);

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO intervention_zones'),
        ['Zone A', 'Northern sector', JSON.stringify(data.geometry)],
      );
    });

    it('passes geometry as-is when none provided', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      await zoneRepository.create({ name: 'Zone A', description: 'Desc' });

      const params = mockDb.query.mock.calls[0][1];
      expect(params[2]).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates name and description', async () => {
      const updated = { ...fakeRow, name: 'Zone A Updated' };
      mockDb.query.mockResolvedValue({ rows: [updated] });

      const result = await zoneRepository.update(1, { name: 'Zone A Updated', description: 'Updated desc' });

      expect(result).toEqual(updated);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE intervention_zones'),
        ['Zone A Updated', 'Updated desc', 1],
      );
    });

    it('updates geometry', async () => {
      const geom = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      await zoneRepository.update(1, { geometry: geom });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_GeomFromGeoJSON'),
        [JSON.stringify(geom), 1],
      );
    });

    it('appends updated_at = NOW() to SET clause', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      await zoneRepository.update(1, { name: 'Renamed' });

      expect(mockDb.query.mock.calls[0][0]).toContain('updated_at = NOW()');
    });

    it('returns existing record when no fields to update', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await zoneRepository.update(1, {});

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1],
      );
    });

    it('returns null when findById returns null on empty update', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.update(999, {});

      expect(result).toBeNull();
    });

    it('returns null when UPDATE returns no rows (non-existent id)', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.update(999, { name: 'Ghost' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes and returns the deleted id', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await zoneRepository.remove(1);

      expect(result).toEqual({ id: 1 });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM intervention_zones'),
        [1],
      );
    });

    it('returns null when zone does not exist', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.remove(999);

      expect(result).toBeNull();
    });
  });
});
