import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
};
const mockAuthRepository = {
  findProfileById: vi.fn(),
};

const { authenticate, authorize } = proxyquire('./auth', {
  '../config/supabase': { supabase: mockSupabaseClient },
  '../repositories/authRepository': mockAuthRepository,
});

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {};
    next = vi.fn();
  });

  it('authenticates user with valid token', async () => {
    req.headers.authorization = 'Bearer valid-token';
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
    mockAuthRepository.findProfileById.mockResolvedValue({ role: 'admin', full_name: 'Test User', created_at: new Date() });

    await authenticate(req, res, next);

    expect(req.user.id).toBe('user-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects if no authorization header', async () => {
    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects if header is not bearer', async () => {
    req.headers.authorization = 'Basic token';

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('throws when no profile row exists', async () => {
    req.headers.authorization = 'Bearer valid-token';
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
    mockAuthRepository.findProfileById.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Perfil de usuario no encontrado. Contacta al administrador.');
  });

  it('passes error to next if supabase fails', async () => {
    req.headers.authorization = 'Bearer valid-token';
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('authorize middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: {} };
    res = {};
    next = vi.fn();
  });

  it('allows access to authorized role', async () => {
    req.user.role = 'admin';
    const middleware = authorize('admin', 'technician');

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows access to technician', async () => {
    req.user.role = 'technician';
    const middleware = authorize('admin', 'technician');

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects if role is not authorized', async () => {
    req.user.role = 'viewer';
    const middleware = authorize('admin', 'technician');

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects if user has no role', async () => {
    req.user.role = undefined;
    const middleware = authorize('admin');

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects if role does not match any', async () => {
    req.user.role = 'technician';
    const middleware = authorize('admin');

    await middleware(req, res, next);
    const errorCall = next.mock.calls[0][0];
    expect(errorCall.status).toBe(403);
    expect(errorCall.message).toBe('No tienes permisos para esta acción');
  });
});
