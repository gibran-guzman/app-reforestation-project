import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { upload: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()), authorize: vi.fn(() => (_req, _res, next) => next()) };
const mockUpload = { single: vi.fn(() => (req, _res, next) => { req.file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' }; next(); }) };

const router = proxyquire('./photoRoutes', {
  '../controllers/photoController': mockController,
  '../middleware/auth': mockAuth,
  '../middleware/upload': mockUpload,
});

describe('photoRoutes', () => {
  it('has POST / route', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/', methods: { post: true } })]),
    );
  });
});
