import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const monitoringRepository = proxyquire('./monitoringRepository', {
  '../config/db': mockDb,
});

describe('monitoringRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('inserts and returns the created record', async () => {
      const fakeRow = { id: 1, planting_site_id: 10, visit_date: '2026-06-01', ph: 6.5, humidity: 70, soil_texture: 'loam', survival_status: 'alive', vigor: 'good', notes: 'ok', photo_url: 'http://example.com/photo.jpg', monitored_by: 'user-1', created_at: new Date() };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await monitoringRepository.create({
        planting_site_id: 10, visit_date: '2026-06-01', ph: 6.5, humidity: 70, soil_texture: 'loam', survival_status: 'alive', vigor: 'good', notes: 'ok', photo_url: 'http://example.com/photo.jpg', monitored_by: 'user-1',
      });

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO monitoring_records'),
        [10, '2026-06-01', 6.5, 70, 'loam', 'alive', 'good', 'ok', 'http://example.com/photo.jpg', 'user-1'],
      );
    });
  });

  describe('findByPlantingSiteId', () => {
    it('returns records ordered by visit_date DESC', async () => {
      const rows = [
        { id: 2, planting_site_id: 10, visit_date: '2026-06-15' },
        { id: 1, planting_site_id: 10, visit_date: '2026-06-01' },
      ];
      mockDb.query.mockResolvedValue({ rows });

      const result = await monitoringRepository.findByPlantingSiteId(10);

      expect(result).toEqual(rows);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE planting_site_id = $1'),
        [10],
      );
    });

    it('returns empty array when no records found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await monitoringRepository.findByPlantingSiteId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns the record when found', async () => {
      const fakeRow = { id: 1, planting_site_id: 10 };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await monitoringRepository.findById(1);

      expect(result).toEqual(fakeRow);
    });

    it('returns null when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await monitoringRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates specified fields and returns updated record', async () => {
      const fakeRow = { id: 1, planting_site_id: 10, survival_status: 'dead', vigor: 'poor' };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await monitoringRepository.update(1, { survival_status: 'dead', vigor: 'poor' });

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE monitoring_records'),
        ['dead', 'poor', 1],
      );
    });

    it('returns existing record when no fields to update', async () => {
      const fakeRow = { id: 1 };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await monitoringRepository.update(1, {});

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1],
      );
    });

    it('ignores undefined fields', async () => {
      const fakeRow = { id: 1, visit_date: '2026-07-01' };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      const result = await monitoringRepository.update(1, { visit_date: '2026-07-01', ph: undefined });

      expect(result).toEqual(fakeRow);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        ['2026-07-01', 1],
      );
    });

    it('updates all allowed fields', async () => {
      const fakeRow = { id: 1 };
      mockDb.query.mockResolvedValue({ rows: [fakeRow] });

      await monitoringRepository.update(1, {
        visit_date: '2026-07-01', ph: 7, humidity: 80, soil_texture: 'clay', survival_status: 'alive', vigor: 'excellent', notes: 'great', photo_url: 'http://example.com/new.jpg',
      });

      expect(mockDb.query.mock.calls[0][1]).toHaveLength(9);
    });
  });

  describe('remove', () => {
    it('deletes the record by id', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await monitoringRepository.remove(1);

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM monitoring_records WHERE id = $1',
        [1],
      );
    });
  });
});
