import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const mockCache = { get: vi.fn(), set: vi.fn(), invalidate: vi.fn(), invalidateAll: vi.fn() };
const speciesRepository = proxyquire('./speciesRepository', {
  '../config/db': mockDb,
  '../utils/memoryCache': vi.fn(() => mockCache),
});

const fakeRow = {
  id: 1, scientific_name: 'Quercus robur', common_name: 'Oak', description: 'A sturdy tree', ideal_soil_type: 'loam', recommended_altitude_min: 100, recommended_altitude_max: 2000, created_at: new Date(),
};

describe('speciesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('inserts and returns the created species', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const data = { scientific_name: 'Quercus robur', common_name: 'Oak', description: 'A sturdy tree', ideal_soil_type: 'loam', recommended_altitude_min: 100, recommended_altitude_max: 2000 };
      const result = await speciesRepository.create(data);

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO species'),
        ['Quercus robur', 'Oak', 'A sturdy tree', 'loam', 100, 2000],
      );
    });
  });

  describe('findAll', () => {
    it('returns all species ordered by scientific_name', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockDb.query.mockResolvedValue({ rows: [fakeRow, { ...fakeRow, id: 2 }] });

      const result = await speciesRepository.findAll();

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY scientific_name'),
      );
    });

    it('returns empty array when no species', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await speciesRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('returns species matching given ids', async () => {
      const rows = [fakeRow, { ...fakeRow, id: 2, scientific_name: 'Pinus radiata' }];
      mockDb.query.mockResolvedValue({ rows });

      const result = await speciesRepository.findByIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN ($1,$2)'),
        [1, 2],
      );
    });

    it('returns empty array for empty ids list', async () => {
      const result = await speciesRepository.findByIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns the species when found', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await speciesRepository.findById(1);

      expect(result).toEqual(fakeRow);
    });

    it('returns null when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await speciesRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates specified fields and returns updated record', async () => {
      const updated = { ...fakeRow, common_name: 'English Oak' };
      mockDb.query.mockResolvedValue({ rows: [updated] });

      const result = await speciesRepository.update(1, { common_name: 'English Oak' });

      expect(result).toEqual(updated);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE species'),
        ['English Oak', 1],
      );
    });

    it('updates all fields', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      await speciesRepository.update(1, {
        scientific_name: 'Pinus sylvestris', common_name: 'Pine', description: 'Conifer', ideal_soil_type: 'sandy', recommended_altitude_min: 50, recommended_altitude_max: 1500,
      });

      expect(mockDb.query.mock.calls[0][1]).toHaveLength(7);
    });

    it('returns existing record when no fields to update', async () => {
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await speciesRepository.update(1, {});

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1],
      );
    });

    it('returns null if findById returns null on empty update', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await speciesRepository.update(999, {});

      expect(result).toBeNull();
    });

    it('returns null when UPDATE returns no rows (non-existent id)', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await speciesRepository.update(999, { common_name: 'Ghost' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes and returns the deleted id', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await speciesRepository.remove(1);

      expect(result).toEqual({ id: 1 });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM species WHERE id = $1'),
        [1],
      );
    });

    it('returns null when species does not exist', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await speciesRepository.remove(999);

      expect(result).toBeNull();
    });
  });
});
