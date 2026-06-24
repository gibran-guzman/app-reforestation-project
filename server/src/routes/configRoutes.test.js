import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockController = { getSoilTextures: vi.fn() };

const router = proxyquire('./configRoutes', {
  '../controllers/configController': mockController,
});

describe('configRoutes', () => {
  it('has GET /soil-textures route', () => {
    const routes = router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods }));
    expect(routes).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/soil-textures', methods: { get: true } })]),
    );
  });

  it('does not require authentication', () => {
    expect(router.stack.length).toBe(1);
  });
});
