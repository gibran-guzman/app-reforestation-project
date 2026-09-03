import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockWs = {};
const mockCreateClient = vi.fn(() => ({
  auth: { signIn: vi.fn(), signOut: vi.fn() },
  storage: { from: vi.fn(), listBuckets: vi.fn(), createBucket: vi.fn() },
}));

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: mockWs },
};

function loadSupabase() {
  return proxyquire('./supabase', {
    '@supabase/supabase-js': { createClient: mockCreateClient },
    ws: mockWs,
  });
}

function withEnv(env, fn) {
  const originals = {};
  Object.keys(env).forEach((key) => {
    originals[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  });
  try {
    return fn();
  } finally {
    Object.keys(env).forEach((key) => {
      if (originals[key] === undefined) delete process.env[key];
      else process.env[key] = originals[key];
    });
  }
}

describe('supabase config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads successfully with service and anon keys', () => {
    const { supabase, supabaseAnon } = loadSupabase();

    expect(mockCreateClient).toHaveBeenCalledTimes(2);
    expect(mockCreateClient).toHaveBeenCalledWith('http://localhost:54321', 'test-key', expect.objectContaining(clientOptions));
    expect(mockCreateClient).toHaveBeenCalledWith('http://localhost:54321', 'test-anon-key', expect.objectContaining(clientOptions));
    expect(supabase).toBeDefined();
    expect(supabaseAnon).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabaseAnon.auth).toBeDefined();
  });

  it('throws when SUPABASE_URL is missing', () => {
    withEnv({ SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined }, () => {
      expect(() => loadSupabase()).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
      );
    });
  });

  it('throws when only SUPABASE_URL is missing', () => {
    withEnv({ SUPABASE_URL: undefined }, () => {
      expect(() => loadSupabase()).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
      );
    });
  });

  it('throws when only SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    withEnv({ SUPABASE_SERVICE_ROLE_KEY: undefined }, () => {
      expect(() => loadSupabase()).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
      );
    });
  });

  it('throws when SUPABASE_ANON_KEY is missing', () => {
    withEnv({ SUPABASE_ANON_KEY: undefined }, () => {
      expect(() => loadSupabase()).toThrow('SUPABASE_ANON_KEY must be defined in environment');
    });
  });

  it('does not mutate NODE_TLS_REJECT_UNAUTHORIZED globally', () => {
    withEnv({ SUPABASE_ANON_KEY: 'test-anon-key' }, () => {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      loadSupabase();
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
    });
  });
});
