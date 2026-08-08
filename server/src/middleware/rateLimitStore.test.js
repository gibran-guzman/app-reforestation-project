import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const dbMock = {
  query: vi.fn(),
};

const { PostgresRateLimitStore } = proxyquire('./rateLimitStore', {
  '../config/db': dbMock,
});

describe('PostgresRateLimitStore', () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new PostgresRateLimitStore({ windowMs: 15 * 60 * 1000 });
  });

  afterEach(async () => {
    await store.shutdown();
  });

  it('marks localKeys as false (shared store)', () => {
    expect(store.localKeys).toBe(false);
  });

  it('increments a key and returns totalHits with resetTime', async () => {
    const resetAt = new Date();
    dbMock.query.mockResolvedValue({ rows: [{ total_hits: 3, reset_at: resetAt }] });

    const result = await store.increment('ip:1.2.3.4');

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO rate_limits'),
      ['ip:1.2.3.4', 15 * 60 * 1000],
    );
    expect(result).toEqual({ totalHits: 3, resetTime: resetAt });
  });

  it('decrements a key without going below zero', async () => {
    dbMock.query.mockResolvedValue({ rows: [] });

    await store.decrement('ip:1.2.3.4');

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('GREATEST(total_hits - 1, 0)'),
      ['ip:1.2.3.4'],
    );
  });

  it('gets an active counter', async () => {
    const resetAt = new Date();
    dbMock.query.mockResolvedValue({ rows: [{ total_hits: 2, reset_at: resetAt }] });

    const result = await store.get('ip:1.2.3.4');

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('reset_at > now()'),
      ['ip:1.2.3.4'],
    );
    expect(result).toEqual({ totalHits: 2, resetTime: resetAt });
  });

  it('returns undefined when no active counter exists', async () => {
    dbMock.query.mockResolvedValue({ rows: [] });

    const result = await store.get('ip:1.2.3.4');

    expect(result).toBeUndefined();
  });

  it('resets a key', async () => {
    dbMock.query.mockResolvedValue({ rows: [] });

    await store.resetKey('ip:1.2.3.4');

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM rate_limits'),
      ['ip:1.2.3.4'],
    );
  });

  it('resets all keys', async () => {
    dbMock.query.mockResolvedValue({ rows: [] });

    await store.resetAll();

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM rate_limits'),
    );
  });
});
