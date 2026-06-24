import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { getSurvivalRate: vi.fn(), getSpeciesStats: vi.fn(), getZoneSummary: vi.fn(), exportPdf: vi.fn(), getPlantingEvolution: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()) };

const router = proxyquire('./reportsRoutes', {
  '../controllers/reportsController': mockController,
  '../middleware/auth': mockAuth,
});

describe('reportsRoutes', () => {
  it('has all expected routes', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/survival-rate', methods: { get: true } }),
        expect.objectContaining({ path: '/species-stats', methods: { get: true } }),
        expect.objectContaining({ path: '/zone-summary', methods: { get: true } }),
        expect.objectContaining({ path: '/export/pdf', methods: { get: true } }),
        expect.objectContaining({ path: '/planting-evolution', methods: { get: true } }),
      ]),
    );
  });
});
