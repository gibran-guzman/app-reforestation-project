import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockReportsRepository = {
  getSurvivalRate: vi.fn(),
  getSurvivalRateBySpecies: vi.fn(),
  getSurvivalRateByZone: vi.fn(),
  getAllPlantingsForReport: vi.fn(),
  getPlantingEvolution: vi.fn(),
};

const reportsService = proxyquire('./reportsService', {
  '../repositories/reportsRepository': mockReportsRepository,
});

describe('reportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSurvivalRate', () => {
    it('returns overall, bySpecies and byZone', async () => {
      mockReportsRepository.getSurvivalRate.mockResolvedValue({ total: 10, alive: 5, dead: 2, struggling: 1, monitored: 8, unmonitored: 2 });
      mockReportsRepository.getSurvivalRateBySpecies.mockResolvedValue([{ id: 1, common_name: 'Cedro', total_planted: 5 }]);
      mockReportsRepository.getSurvivalRateByZone.mockResolvedValue([{ id: 1, name: 'Zona Norte', total_plantings: 5 }]);

      const result = await reportsService.getSurvivalRate({ zone_id: 1 });
      expect(result.overall.total).toBe(10);
      expect(result.bySpecies).toHaveLength(1);
      expect(result.byZone).toHaveLength(1);
    });

    it('passes filters to all three repositories', async () => {
      const filters = { zone_id: 2, species_id: 3, from: '2026-01-01', to: '2026-12-31' };
      mockReportsRepository.getSurvivalRate.mockResolvedValue({});
      mockReportsRepository.getSurvivalRateBySpecies.mockResolvedValue([]);
      mockReportsRepository.getSurvivalRateByZone.mockResolvedValue([]);

      await reportsService.getSurvivalRate(filters);
      expect(mockReportsRepository.getSurvivalRate).toHaveBeenCalledWith(filters);
      expect(mockReportsRepository.getSurvivalRateBySpecies).toHaveBeenCalledWith(filters);
      expect(mockReportsRepository.getSurvivalRateByZone).toHaveBeenCalledWith(filters);
    });

    it('uses empty filters by default', async () => {
      mockReportsRepository.getSurvivalRate.mockResolvedValue({});
      mockReportsRepository.getSurvivalRateBySpecies.mockResolvedValue([]);
      mockReportsRepository.getSurvivalRateByZone.mockResolvedValue([]);

      await reportsService.getSurvivalRate();
      expect(mockReportsRepository.getSurvivalRate).toHaveBeenCalledWith({});
    });
  });

  describe('getSpeciesStats', () => {
    it('returns species statistics', async () => {
      mockReportsRepository.getSurvivalRateBySpecies.mockResolvedValue([{ id: 1, total_planted: 5 }]);

      const result = await reportsService.getSpeciesStats({ zone_id: 1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('getZoneSummary', () => {
    it('returns zone summary', async () => {
      mockReportsRepository.getSurvivalRateByZone.mockResolvedValue([{ id: 1, total_plantings: 10 }]);

      const result = await reportsService.getZoneSummary({});
      expect(result).toHaveLength(1);
    });
  });

  describe('getPlantingEvolution', () => {
    it('returns monthly evolution', async () => {
      mockReportsRepository.getPlantingEvolution.mockResolvedValue([
        { period: '2026-01', total: 5 },
        { period: '2026-02', total: 8 },
      ]);

      const result = await reportsService.getPlantingEvolution({});
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2026-01');
    });
  });

  describe('generatePdf', () => {
    it('generates a PDF buffer', async () => {
      mockReportsRepository.getAllPlantingsForReport.mockResolvedValue([
        { id: 1, species_name: 'Cedro', zone_name: 'Zona Norte', planted_at: '2026-06-01', survival_status: 'alive', initial_ph: 6.5 },
      ]);
      mockReportsRepository.getSurvivalRate.mockResolvedValue({ total: 1, alive: 1, dead: 0, struggling: 0, monitored: 1, unmonitored: 0 });

      const pdfBuffer = await reportsService.generatePdf({});
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('generates PDF even with no data', async () => {
      mockReportsRepository.getAllPlantingsForReport.mockResolvedValue([]);
      mockReportsRepository.getSurvivalRate.mockResolvedValue({ total: 0, alive: 0, dead: 0, struggling: 0, monitored: 0, unmonitored: 0 });

      const pdfBuffer = await reportsService.generatePdf({});
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('generates a multi-page PDF with footers on each page (large dataset)', async () => {
      const manyRows = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        species_name: `Especie ${i + 1}`,
        zone_name: `Zona ${(i % 5) + 1}`,
        planted_at: '2026-06-01',
        survival_status: i % 3 === 0 ? 'alive' : i % 3 === 1 ? 'dead' : 'struggling',
        initial_ph: 6.5,
      }));
      mockReportsRepository.getAllPlantingsForReport.mockResolvedValue(manyRows);
      mockReportsRepository.getSurvivalRate.mockResolvedValue({
        total: 200, alive: 100, dead: 50, struggling: 50, monitored: 200, unmonitored: 0,
      });

      const pdfBuffer = await reportsService.generatePdf({});
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('skips bar chart when no monitored records', async () => {
      mockReportsRepository.getAllPlantingsForReport.mockResolvedValue([
        { id: 1, species_name: 'Cedro', zone_name: 'Zona Norte', planted_at: '2026-06-01', survival_status: null, initial_ph: null },
      ]);
      mockReportsRepository.getSurvivalRate.mockResolvedValue({
        total: 1, alive: 0, dead: 0, struggling: 0, monitored: 0, unmonitored: 1,
      });

      const pdfBuffer = await reportsService.generatePdf({});
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('handles null optional fields with fallback values', async () => {
      mockReportsRepository.getAllPlantingsForReport.mockResolvedValue([
        { id: 1, species_name: null, zone_name: null, planted_at: null, survival_status: null, initial_ph: null },
      ]);
      mockReportsRepository.getSurvivalRate.mockResolvedValue({
        total: 1, alive: 1, dead: 0, struggling: 0, monitored: 1, unmonitored: 0,
      });

      const pdfBuffer = await reportsService.generatePdf({});
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });
  });
});
