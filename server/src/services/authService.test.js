import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockDb = { query: vi.fn() };
const mockSupabaseClient = {
  auth: {
    admin: { createUser: vi.fn(), deleteUser: vi.fn() },
    signInWithPassword: vi.fn(),
  },
};

const authService = proxyquire('./authService', {
  '../config/supabase': mockSupabaseClient,
  '../config/db': mockDb,
});

describe('authService.signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a user successfully', async () => {
    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await authService.signup({
      email: 'test@example.com',
      password: 'SecurePass1',
      full_name: 'Test User',
      role: 'technician',
    });

    expect(result.email).toBe('test@example.com');
    expect(result.id).toBe('user-123');
  });

  it('throws 409 if email is already registered', async () => {
    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'already registered' },
    });

    await expect(authService.signup({
      email: 'existing@example.com',
      password: 'SecurePass1',
      full_name: 'Existing',
    })).rejects.toThrow();

    try {
      await authService.signup({ email: 'existing@example.com', password: 'SecurePass1', full_name: 'Existing' });
    } catch (err) {
      expect(err.status).toBe(409);
    }
  });

  it('deletes supabase user if profile insert fails', async () => {
    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'user-456' } },
      error: null,
    });
    mockDb.query.mockRejectedValue(new Error('db error'));

    await expect(authService.signup({
      email: 'rollback@example.com',
      password: 'SecurePass1',
      full_name: 'Rollback Test',
    })).rejects.toThrow();

    expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-456');
  });

  it('throws validation error with invalid data', async () => {
    await expect(authService.signup({})).rejects.toThrow();
  });
});

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates and returns session with profile', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token-abc', refresh_token: 'refresh-xyz', expires_at: 9999999999 },
      },
      error: null,
    });
    mockDb.query.mockResolvedValue({ rows: [{ role: 'technician', full_name: 'Test User' }] });

    const result = await authService.login({ email: 'test@example.com', password: 'SecurePass1' });

    expect(result.user.email).toBe('test@example.com');
    expect(result.session.access_token).toBe('token-abc');
  });

  it('returns empty profile when no profiles row exists', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token', refresh_token: 'refresh', expires_at: 9999999999 },
      },
      error: null,
    });
    mockDb.query.mockResolvedValue({ rows: [] });

    const result = await authService.login({ email: 'test@example.com', password: 'SecurePass1' });
    expect(result.user.role).toBeUndefined();
  });

  it('throws 401 with incorrect credentials', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(authService.login({ email: 'bad@example.com', password: 'wrong' })).rejects.toThrow();

    try {
      await authService.login({ email: 'bad@example.com', password: 'wrong' });
    } catch (err) {
      expect(err.status).toBe(401);
    }
  });

  it('throws validation error if fields are missing', async () => {
    await expect(authService.login({})).rejects.toThrow();
  });

  it('throws the raw authError if signup error is not "already registered"', async () => {
    const rawError = new Error('Some other auth error');
    mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: rawError,
    });

    await expect(authService.signup({
      email: 'test@example.com',
      password: 'SecurePass1',
      full_name: 'Test User',
    })).rejects.toThrow('Some other auth error');
  });
});

describe('authService.login - non-specific errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws the raw error if login error is not "Invalid login credentials"', async () => {
    const rawError = new Error('Some other login error');
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: rawError,
    });

    await expect(authService.login({
      email: 'test@example.com',
      password: 'SecurePass1',
    })).rejects.toThrow('Some other login error');
  });
});
