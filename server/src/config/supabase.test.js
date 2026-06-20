import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockWs = {};
const mockCreateClient = vi.fn(() => ({
  auth: { signIn: vi.fn(), signOut: vi.fn() },
  storage: { from: vi.fn(), listBuckets: vi.fn(), createBucket: vi.fn() },
}));

function loadSupabase() {
  return proxyquire('./supabase', {
    '@supabase/supabase-js': { createClient: mockCreateClient },
    ws: mockWs,
  });
}

describe('supabase config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads successfully when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set', () => {
    const { supabase } = loadSupabase();

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'test-key',
      expect.objectContaining({
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: mockWs },
      }),
    );
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('throws when SUPABASE_URL is missing', () => {
    const originalUrl = process.env.SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => loadSupabase()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
    );

    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it('throws when only SUPABASE_URL is missing', () => {
    const originalUrl = process.env.SUPABASE_URL;
    delete process.env.SUPABASE_URL;

    expect(() => loadSupabase()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
    );

    process.env.SUPABASE_URL = originalUrl;
  });

  it('throws when only SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => loadSupabase()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment',
    );

    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
});
