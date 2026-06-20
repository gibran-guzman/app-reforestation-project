import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), syncBatch: vi.fn(), getGeoJson: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()), authorize: vi.fn(() => (_req, _res, next) => next()) };
const mockValidate = vi.fn(() => (_req, _res, next) => next());
const mockPlantingValidator = { validateCreatePlanting: vi.fn(x => x) };

const router = proxyquire('./plantingRoutes', {
  '../controllers/plantingController': mockController,
  '../middleware/auth': mockAuth,
  '../middleware/validate': mockValidate,
  '../validators/plantingValidator': mockPlantingValidator,
});

describe('plantingRoutes', () => {
  it('has all expected routes', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/', methods: { get: true } }),
        expect.objectContaining({ path: '/geojson', methods: { get: true } }),
        expect.objectContaining({ path: '/:id', methods: { get: true } }),
        expect.objectContaining({ path: '/', methods: { post: true } }),
        expect.objectContaining({ path: '/sync', methods: { post: true } }),
      ]),
    );
  });
});
