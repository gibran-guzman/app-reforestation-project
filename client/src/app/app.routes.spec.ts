import { routes } from './app.routes';

describe('appRoutes', () => {
  it('should have routes defined', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBeTrue();
  });

  it('should have expected route paths', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('login');
    expect(paths).toContain('register');
    expect(paths).toContain('dashboard');
    expect(paths).toContain('species');
    expect(paths).toContain('zones');
    expect(paths).toContain('plantings');
    expect(paths).toContain('map');
    expect(paths).toContain('reports');
    expect(paths).toContain('');
  });

  it('should have redirect route for empty path', () => {
    const emptyRoute = routes.find((r) => r.path === '');
    expect(emptyRoute).toBeDefined();
    expect(emptyRoute!.redirectTo).toBe('/dashboard');
    expect(emptyRoute!.pathMatch).toBe('full');
  });

  it('should have auth guard on protected routes', () => {
    const protectedRoutes = routes.filter((r) => r.path && r.path !== 'login' && r.path !== '');
    for (const route of protectedRoutes) {
      expect(route.canActivate).toBeDefined();
    }
  });

  it('should lazy-load all components', async () => {
    const uniqueLoaders = new Set(routes.filter(r => r.loadComponent).map(r => r.loadComponent!));
    for (const loader of uniqueLoaders) {
      const mod = await (loader as Function)();
      expect(mod).toBeDefined();
    }
  });
});
