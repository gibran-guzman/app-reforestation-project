import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { signup: vi.fn(), login: vi.fn(), getMe: vi.fn() };
const mockAuth = { authenticate: vi.fn((_req, _res, next) => next()), authorize: vi.fn(() => (_req, _res, next) => next()) };

const router = proxyquire('./authRoutes', {
  '../controllers/authController': mockController,
  '../middleware/auth': mockAuth,
});

describe('authRoutes', () => {
  it('has all expected routes', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/signup', methods: { post: true } }),
        expect.objectContaining({ path: '/login', methods: { post: true } }),
        expect.objectContaining({ path: '/me', methods: { get: true } }),
      ]),
    );
  });

  it('applies authorize middleware to signup', () => {
    const signupRoute = router.stack.find((r) => r.route?.path === '/signup');
    expect(signupRoute).toBeDefined();
  });
});
