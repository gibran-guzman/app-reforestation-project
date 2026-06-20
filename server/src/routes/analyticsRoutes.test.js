import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { getHeatmap: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()) };

const router = proxyquire('./analyticsRoutes', {
  '../controllers/analyticsController': mockController,
  '../middleware/auth': mockAuth,
});

describe('analyticsRoutes', () => {
  it('has GET /heatmap route', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/heatmap', methods: { get: true } })]),
    );
  });
});
