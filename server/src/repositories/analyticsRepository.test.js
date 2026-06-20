import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const analyticsRepository = proxyquire('./analyticsRepository', {
  '../config/db': mockDb,
});

describe('analyticsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHeatmapData', () => {
    it('returns mapped heatmap data with no filters', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { lat: '-0.229', lng: '-78.524', planted_at: '2026-06-01', survival_status: 'alive' },
          { lat: '-0.230', lng: '-78.525', planted_at: '2026-06-15', survival_status: 'dead' },
          { lat: '-0.231', lng: '-78.526', planted_at: '2026-07-01', survival_status: 'struggling' },
          { lat: '-0.232', lng: '-78.527', planted_at: '2026-07-05', survival_status: null },
        ],
      });

      const result = await analyticsRepository.getHeatmapData();

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        lat: -0.229, lng: -78.524, planted_at: '2026-06-01', weight: 0, survival_status: 'alive',
      });
      expect(result[1]).toEqual({
        lat: -0.230, lng: -78.525, planted_at: '2026-06-15', weight: 1, survival_status: 'dead',
      });
      expect(result[2]).toEqual({
        lat: -0.231, lng: -78.526, planted_at: '2026-07-01', weight: 0.5, survival_status: 'struggling',
      });
      expect(result[3]).toEqual({
        lat: -0.232, lng: -78.527, planted_at: '2026-07-05', weight: null, survival_status: null,
      });
    });

    it('applies zone_id filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await analyticsRepository.getHeatmapData({ zone_id: 1 });

      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('ps.zone_id = $1'), [1]);
    });

    it('applies species_id filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await analyticsRepository.getHeatmapData({ species_id: 2 });

      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('ps.species_id = $1'), [2]);
    });

    it('applies from filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await analyticsRepository.getHeatmapData({ from: '2026-01-01' });

      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('ps.planted_at >= $1'), ['2026-01-01']);
    });

    it('applies to filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await analyticsRepository.getHeatmapData({ to: '2026-12-31' });

      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('ps.planted_at <= $1'), ['2026-12-31']);
    });

    it('applies all filters simultaneously', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await analyticsRepository.getHeatmapData({
        zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31',
      });

      const call = mockDb.query.mock.calls[0];
      expect(call[0]).toContain('ps.zone_id = $1');
      expect(call[0]).toContain('ps.species_id = $2');
      expect(call[0]).toContain('ps.planted_at >= $3');
      expect(call[0]).toContain('ps.planted_at <= $4');
      expect(call[1]).toEqual([1, 2, '2026-01-01', '2026-12-31']);
    });

    it('returns empty array when no data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await analyticsRepository.getHeatmapData({ zone_id: 999 });

      expect(result).toEqual([]);
    });
  });
});
