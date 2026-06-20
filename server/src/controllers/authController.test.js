import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockService = { signup: vi.fn(), login: vi.fn() };
const { signup, login, getMe } = proxyquire('./authController', {
  '../services/authService': mockService,
});

describe('authController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('signup', () => {
    it('creates user and returns 201', async () => {
      mockService.signup.mockResolvedValue({ id: 'user-123', email: 'test@test.com' });
      req.body = { email: 'test@test.com', password: 'Secure1', full_name: 'Test' };

      await signup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Usuario registrado correctamente',
      }));
    });

    it('passes error to next if service fails', async () => {
      mockService.signup.mockRejectedValue(new Error('DB error'));
      req.body = { email: 'test@test.com', password: 'Secure1', full_name: 'Test' };

      await signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    it('authenticates and returns session', async () => {
      mockService.login.mockResolvedValue({ session: { access_token: 'token' }, user: { email: 'test@test.com' } });
      req.body = { email: 'test@test.com', password: 'Secure1' };

      await login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Inicio de sesión exitoso',
      }));
    });

    it('passes error to next if login fails', async () => {
      mockService.login.mockRejectedValue(new Error('Credenciales inválidas'));

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMe', () => {
    it('returns authenticated user data', async () => {
      req.user = { id: 'user-123', email: 'test@test.com', role: 'technician', full_name: 'Test', created_at: '2026-01-01' };

      await getMe(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'user-123', email: 'test@test.com', role: 'technician', full_name: 'Test', created_at: '2026-01-01' },
      });
    });

    it('passes error to next if user is undefined', async () => {
      req.user = undefined;

      await getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
