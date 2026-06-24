import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const reportsRepository = proxyquire('./reportsRepository', {
  '../config/db': mockDb,
});

describe('reportsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSurvivalRate', () => {
    it('returns survival stats with no filters', async () => {
      const statsRow = { total: 10, monitored: 7, alive: 4, struggling: 2, dead: 1, unmonitored: 3 };
      mockDb.query.mockResolvedValue({ rows: [statsRow] });

      const result = await reportsRepository.getSurvivalRate();

      expect(result).toEqual(statsRow);
    });

    it('applies filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ total: 0, monitored: 0, alive: 0, struggling: 0, dead: 0, unmonitored: 0 }] });

      await reportsRepository.getSurvivalRate({ zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31' });

      expect(mockDb.query.mock.calls[0][1]).toEqual([1, 2, '2026-01-01', '2026-12-31']);
    });

    it('handles empty filters passed as empty object', async () => {
      const statsRow = { total: 5, monitored: 3, alive: 2, struggling: 1, dead: 0, unmonitored: 2 };
      mockDb.query.mockResolvedValue({ rows: [statsRow] });

      const result = await reportsRepository.getSurvivalRate({});

      expect(result).toEqual(statsRow);
    });
  });

  describe('getSurvivalRateBySpecies', () => {
    it('returns species breakdown', async () => {
      const rows = [
        { id: 1, common_name: 'Oak', scientific_name: 'Quercus', total_planted: 10, monitored: 7, alive: 5, struggling: 1, dead: 1 },
        { id: 2, common_name: 'Pine', scientific_name: 'Pinus', total_planted: 5, monitored: 3, alive: 2, struggling: 0, dead: 1 },
      ];
      mockDb.query.mockResolvedValue({ rows });

      const result = await reportsRepository.getSurvivalRateBySpecies();

      expect(result).toHaveLength(2);
      expect(result[0].common_name).toBe('Oak');
    });

    it('returns empty array when no data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await reportsRepository.getSurvivalRateBySpecies({ zone_id: 999 });

      expect(result).toEqual([]);
    });

    it('applies zone filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getSurvivalRateBySpecies({ zone_id: 3 });

      expect(mockDb.query.mock.calls[0][1]).toEqual([3]);
    });
  });

  describe('getSurvivalRateByZone', () => {
    it('returns zone breakdown', async () => {
      const rows = [
        { id: 1, name: 'Zone A', total_plantings: 15, monitored: 10, alive: 7, struggling: 2, dead: 1 },
      ];
      mockDb.query.mockResolvedValue({ rows });

      const result = await reportsRepository.getSurvivalRateByZone();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Zone A');
    });

    it('returns empty array when no data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await reportsRepository.getSurvivalRateByZone({});

      expect(result).toEqual([]);
    });

    it('applies species filter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getSurvivalRateByZone({ species_id: 5 });

      expect(mockDb.query.mock.calls[0][1]).toEqual([5]);
    });
  });

  describe('getAllPlantingsForReport', () => {
    it('returns up to default limit in a single query', async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));
      mockDb.query.mockResolvedValue({ rows });

      const result = await reportsRepository.getAllPlantingsForReport();

      expect(result).toHaveLength(1000);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('passes limit as last parameter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getAllPlantingsForReport({ zone_id: 1, species_id: 2 });

      expect(mockDb.query.mock.calls[0][1]).toEqual([1, 2, 10000]);
    });

    it('returns empty array when no plantings', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await reportsRepository.getAllPlantingsForReport({ zone_id: 999 });

      expect(result).toEqual([]);
    });

    it('respects custom limit when provided', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getAllPlantingsForReport({}, 500);

      expect(mockDb.query.mock.calls[0][1]).toEqual([500]);
    });
  });

  describe('getPlantingEvolution', () => {
    it('returns monthly totals with no filters', async () => {
      const rows = [
        { period: '2026-01', total: 5 },
        { period: '2026-02', total: 10 },
      ];
      mockDb.query.mockResolvedValue({ rows });

      const result = await reportsRepository.getPlantingEvolution();

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2026-01');
    });

    it('applies all filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getPlantingEvolution({
        zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31',
      });

      const call = mockDb.query.mock.calls[0];
      expect(call[0]).toContain('ps.zone_id = $1');
      expect(call[0]).toContain('ps.species_id = $2');
      expect(call[0]).toContain('ps.planted_at >= $3');
      expect(call[0]).toContain('ps.planted_at <= $4');
      expect(call[1]).toEqual([1, 2, '2026-01-01', '2026-12-31']);
    });

    it('handles empty result', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await reportsRepository.getPlantingEvolution({ zone_id: 999 });

      expect(result).toEqual([]);
    });

    it('handles partial filters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await reportsRepository.getPlantingEvolution({ from: '2026-06-01' });

      expect(mockDb.query.mock.calls[0][1]).toEqual(['2026-06-01']);
    });
  });
});
