import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { getHeatmap: vi.fn() };
const controller = proxyquire('./analyticsController', {
  '../services/analyticsService': mockService,
});

describe('AnalyticsController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { query: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  it('returns heatmap data', async () => {
    mockService.getHeatmap.mockResolvedValue({ periods: [], total: 0 });
    await controller.getHeatmap(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ periods: [], total: 0 });
  });

  it('parses filters from query params', async () => {
    req.query = { zone_id: '1', species_id: '2', from: '2026-01-01', to: '2026-06-01', interval: 'quarter' };
    mockService.getHeatmap.mockResolvedValue({ periods: [], total: 0 });
    await controller.getHeatmap(req, res, next);
    expect(mockService.getHeatmap).toHaveBeenCalledWith({
      zone_id: 1, species_id: 2, from: '2026-01-01', to: '2026-06-01', interval: 'quarter',
    });
  });

  it('passes error to next handler', async () => {
    const error = new Error('Service error');
    mockService.getHeatmap.mockRejectedValue(error);
    await controller.getHeatmap(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
