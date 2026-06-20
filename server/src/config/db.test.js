import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const mockPool = {
  query: vi.fn(),
  on: vi.fn(),
};

const mockPg = { Pool: vi.fn(() => mockPool) };
const mockLogger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };

function loadDb(env) {
  const oldEnv = { ...process.env };
  const keys = Object.keys(env);

  keys.forEach((k) => {
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  });

  try {
    return proxyquire('./db', {
      pg: mockPg,
      '../utils/logger': mockLogger,
    });
  } finally {
    keys.forEach((k) => {
      if (!(k in oldEnv)) {
        delete process.env[k];
      } else {
        process.env[k] = oldEnv[k];
      }
    });
  }
}

describe('db config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates Pool with DATABASE_URL and default options', () => {
    const db = loadDb({ DATABASE_URL: 'postgres://user:pass@localhost:5432/db' });

    expect(mockPg.Pool).toHaveBeenCalledTimes(1);
    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.connectionString).toBe('postgres://user:pass@localhost:5432/db');
    expect(poolOpts.max).toBe(10);
    expect(poolOpts.idleTimeoutMillis).toBe(30000);
    expect(poolOpts.connectionTimeoutMillis).toBe(10000);
    expect(poolOpts.statement_timeout).toBe(30000);
    expect(db.query).toBeDefined();
  });

  it('sets ssl with rejectUnauthorized false by default', () => {
    loadDb({ DATABASE_URL: 'postgres://user:pass@localhost:5432/db' });

    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('sets ssl with rejectUnauthorized false when DB_SSL_REJECT_UNAUTHORIZED is false', () => {
    loadDb({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    });

    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('sets ssl to undefined when DATABASE_URL includes sslmode=require', () => {
    loadDb({
      DATABASE_URL: 'postgres://user:pass@host:5432/db?sslmode=require',
    });

    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.ssl).toBeUndefined();
  });

  it('handles DATABASE_URL with sslmode=require even when DB_SSL_REJECT_UNAUTHORIZED is not false', () => {
    loadDb({
      DATABASE_URL: 'postgres://user:pass@host:5432/db?sslmode=require',
      DB_SSL_REJECT_UNAUTHORIZED: 'true',
    });

    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.ssl).toBeUndefined();
  });

  it('registers pool error handler that calls logger.error', () => {
    loadDb({ DATABASE_URL: 'postgres://user:pass@localhost:5432/db' });

    expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    const errorHandler = mockPool.on.mock.calls[0][1];
    const testErr = new Error('connection lost');
    errorHandler(testErr);
    expect(mockLogger.error).toHaveBeenCalledWith({ err: testErr }, 'Unexpected database pool error');
  });

  it('query function delegates to pool.query', async () => {
    const db = loadDb({ DATABASE_URL: 'postgres://user:pass@localhost:5432/db' });
    const expectedResult = { rows: [{ id: 1 }] };
    mockPool.query.mockResolvedValue(expectedResult);

    const result = await db.query('SELECT 1', []);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(result).toBe(expectedResult);
  });

  it('handles missing DATABASE_URL gracefully', () => {
    loadDb({});

    expect(mockPg.Pool).toHaveBeenCalledTimes(1);
    const poolOpts = mockPg.Pool.mock.calls[0][0];
    expect(poolOpts.connectionString).toBeUndefined();
  });
});
