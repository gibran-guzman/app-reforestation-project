import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockRepository = { getHeatmapData: vi.fn() };
const analyticsService = proxyquire('./analyticsService', {
  '../repositories/analyticsRepository': mockRepository,
});

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHeatmap', () => {
    it('returns ungrouped points when no interval is given', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-06-01', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-06-15', weight: 1, survival_status: 'dead' },
        { lat: -0.231, lng: -78.526, planted_at: '2026-07-01', weight: null, survival_status: null },
      ]);

      const result = await analyticsService.getHeatmap({});

      expect(result.total).toBe(2);
      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].label).toBe('general');
      expect(result.periods[0].data).toHaveLength(2);
    });

    it('groups by month when interval is month', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-01-15', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-02-10', weight: 1, survival_status: 'dead' },
        { lat: -0.231, lng: -78.526, planted_at: '2026-02-20', weight: 0.5, survival_status: 'struggling' },
      ]);

      const result = await analyticsService.getHeatmap({ interval: 'month' });

      expect(result.total).toBe(3);
      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].label).toBe('2026-01');
      expect(result.periods[1].label).toBe('2026-02');
      expect(result.periods[1].data).toHaveLength(2);
    });

    it('groups by quarter when interval is quarter', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-02-15', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-05-10', weight: 1, survival_status: 'dead' },
      ]);

      const result = await analyticsService.getHeatmap({ interval: 'quarter' });

      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].label).toBe('2026-Q1');
      expect(result.periods[1].label).toBe('2026-Q2');
    });

    it('groups by year when interval is year', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2025-06-15', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-03-10', weight: 1, survival_status: 'dead' },
      ]);

      const result = await analyticsService.getHeatmap({ interval: 'year' });

      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].label).toBe('2025');
      expect(result.periods[1].label).toBe('2026');
    });

    it('excludes points with null weight', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-06-01', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-06-15', weight: null, survival_status: null },
      ]);

      const result = await analyticsService.getHeatmap({});

      expect(result.total).toBe(1);
      expect(result.periods[0].data).toHaveLength(1);
    });

    it('sorts periods chronologically', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-03-01', weight: 1, survival_status: 'dead' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-01-01', weight: 0, survival_status: 'alive' },
        { lat: -0.231, lng: -78.526, planted_at: '2026-02-01', weight: 0.5, survival_status: 'struggling' },
      ]);

      const result = await analyticsService.getHeatmap({ interval: 'month' });

      expect(result.periods[0].label).toBe('2026-01');
      expect(result.periods[1].label).toBe('2026-02');
      expect(result.periods[2].label).toBe('2026-03');
    });

    it('returns a single period if all points are from the same month', async () => {
      mockRepository.getHeatmapData.mockResolvedValue([
        { lat: -0.229, lng: -78.524, planted_at: '2026-06-01', weight: 0, survival_status: 'alive' },
        { lat: -0.230, lng: -78.525, planted_at: '2026-06-15', weight: 1, survival_status: 'dead' },
      ]);

      const result = await analyticsService.getHeatmap({ interval: 'month' });

      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].label).toBe('2026-06');
      expect(result.periods[0].data).toHaveLength(2);
    });
  });
});
