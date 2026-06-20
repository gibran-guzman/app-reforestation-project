import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { list: vi.fn(), getById: vi.fn(), createSpecies: vi.fn(), update: vi.fn(), remove: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()), authorize: vi.fn(() => (_req, _res, next) => next()) };

const router = proxyquire('./speciesRoutes', {
  '../controllers/speciesController': mockController,
  '../middleware/auth': mockAuth,
});

describe('speciesRoutes', () => {
  it('has all expected routes', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/', methods: { get: true } }),
        expect.objectContaining({ path: '/:id', methods: { get: true } }),
        expect.objectContaining({ path: '/', methods: { post: true } }),
        expect.objectContaining({ path: '/:id', methods: { put: true } }),
        expect.objectContaining({ path: '/:id', methods: { delete: true } }),
      ]),
    );
  });
});
