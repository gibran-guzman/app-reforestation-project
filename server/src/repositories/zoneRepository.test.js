import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const zoneRepository = proxyquire('./zoneRepository', {
  '../config/db': mockDb,
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
      mockDb.query.mockResolvedValue({ rows: [fakeRow, { ...fakeRow, id: 2, name: 'Zone B' }] });

      const result = await zoneRepository.findAll();

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name'),
      );
    });

    it('returns empty array when no zones', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await zoneRepository.findAll();

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

    it('inserts with default geometry when none provided', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await zoneRepository.create({ name: 'Zone A', description: 'Desc' });

      expect(result).toEqual(fakeRow);
      const params = mockDb.query.mock.calls[0][1];
      const parsed = JSON.parse(params[2]);
      expect(parsed.type).toBe('Polygon');
      expect(parsed.coordinates[0][0]).toEqual([-78.531, -0.234]);
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
