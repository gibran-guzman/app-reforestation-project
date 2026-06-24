import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = {
  getSurvivalRate: vi.fn(),
  getSpeciesStats: vi.fn(),
  getZoneSummary: vi.fn(),
  generatePdf: vi.fn(),
  getPlantingEvolution: vi.fn(),
};

const controller = proxyquire('./reportsController', {
  '../services/reportsService': mockService,
});

describe('reportsController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { filters: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('getSurvivalRate', () => {
    it('returns survival rate data', async () => {
      mockService.getSurvivalRate.mockResolvedValue({ overall: {}, bySpecies: [], byZone: [] });
      req.filters = { zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31' };

      await controller.getSurvivalRate(req, res, next);

      expect(mockService.getSurvivalRate).toHaveBeenCalledWith({ zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-12-31' });
      expect(res.json).toHaveBeenCalledWith({ data: { overall: {}, bySpecies: [], byZone: [] } });
    });
  });

  describe('getSpeciesStats', () => {
    it('returns species statistics', async () => {
      mockService.getSpeciesStats.mockResolvedValue([]);
      req.filters = {};

      await controller.getSpeciesStats(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });
  });

  describe('getZoneSummary', () => {
    it('returns zone summary', async () => {
      mockService.getZoneSummary.mockResolvedValue([]);

      await controller.getZoneSummary(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });
  });

  describe('getPlantingEvolution', () => {
    it('returns evolution data', async () => {
      mockService.getPlantingEvolution.mockResolvedValue([]);

      await controller.getPlantingEvolution(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });
  });

  describe('error paths', () => {
    it('passes getSurvivalRate service error to next', async () => {
      const error = new Error('Service error');
      mockService.getSurvivalRate.mockRejectedValue(error);

      await controller.getSurvivalRate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getSpeciesStats error to next', async () => {
      const error = new Error('Stats error');
      mockService.getSpeciesStats.mockRejectedValue(error);

      await controller.getSpeciesStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getZoneSummary error to next', async () => {
      const error = new Error('Summary error');
      mockService.getZoneSummary.mockRejectedValue(error);

      await controller.getZoneSummary(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes getPlantingEvolution error to next', async () => {
      const error = new Error('Evolution error');
      mockService.getPlantingEvolution.mockRejectedValue(error);

      await controller.getPlantingEvolution(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('exportPdf', () => {
    it('exports PDF with correct headers', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 test data');
      mockService.generatePdf.mockResolvedValue(pdfBuffer);

      await controller.exportPdf(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('reporte-plantaciones-'),
        'Content-Length': 18,
      });
      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });

    it('passes errors to next', async () => {
      mockService.generatePdf.mockRejectedValue(new Error('PDF error'));

      await controller.exportPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
