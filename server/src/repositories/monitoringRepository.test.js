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
    it('returns paginated records with total count', async () => {
      const rows = [
        { id: 2, planting_site_id: 10, visit_date: '2026-06-15' },
        { id: 1, planting_site_id: 10, visit_date: '2026-06-01' },
      ];
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows });

      const result = await monitoringRepository.findByPlantingSiteId(10);

      expect(result).toEqual({ rows, total: 2 });
      expect(mockDb.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT COUNT'),
        [10],
      );
      expect(mockDb.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [10, 50, 0],
      );
    });

    it('accepts custom page and limit', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await monitoringRepository.findByPlantingSiteId(10, 2, 10);

      expect(mockDb.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [10, 10, 10],
      );
    });

    it('returns empty result when no records found', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await monitoringRepository.findByPlantingSiteId(999);

      expect(result).toEqual({ rows: [], total: 0 });
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

});
