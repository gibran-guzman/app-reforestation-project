import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { create: vi.fn(), getByPlantingSiteId: vi.fn(), getById: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()), authorize: vi.fn(() => (_req, _res, next) => next()) };

const router = proxyquire('./monitoringRoutes', {
  '../controllers/monitoringController': mockController,
  '../middleware/auth': mockAuth,
});

describe('monitoringRoutes', () => {
  it('has all expected routes', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/planting/:plantingSiteId', methods: { get: true } }),
        expect.objectContaining({ path: '/:id', methods: { get: true } }),
        expect.objectContaining({ path: '/', methods: { post: true } }),
      ]),
    );
  });
});
