import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const rateLimitMock = vi.fn((opts) => ({
  ...opts,
  resetKey: vi.fn(),
  getKey: vi.fn(),
}));

class MockPostgresRateLimitStore {
  constructor({ windowMs }) {
    this.windowMs = windowMs;
  }
}

const { authLimiter, signupLimiter, photoLimiter, writeLimiter } = proxyquire('./rateLimiter', {
  'express-rate-limit': rateLimitMock,
  './rateLimitStore': { PostgresRateLimitStore: MockPostgresRateLimitStore },
});

describe('rateLimiter', () => {
  it('configures authLimiter with correct parameters', () => {
    expect(authLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(authLimiter.max).toBe(10);
    expect(authLimiter.standardHeaders).toBe(true);
    expect(authLimiter.legacyHeaders).toBe(false);
  });

  it('configures signupLimiter with correct parameters', () => {
    expect(signupLimiter.windowMs).toBe(60 * 60 * 1000);
    expect(signupLimiter.max).toBe(3);
    expect(signupLimiter.standardHeaders).toBe(true);
    expect(signupLimiter.legacyHeaders).toBe(false);
  });

  it('configures writeLimiter with correct parameters', () => {
    expect(writeLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(writeLimiter.max).toBe(60);
    expect(writeLimiter.standardHeaders).toBe(true);
    expect(writeLimiter.legacyHeaders).toBe(false);
  });

  it('has error messages in Spanish', () => {
    expect(authLimiter.message.error).toContain('Demasiadas');
    expect(signupLimiter.message.error).toContain('Demasiados');
    expect(photoLimiter.message.error).toContain('Demasiadas');
    expect(writeLimiter.message.error).toContain('Demasiadas');
  });

  it('calls rateLimit four times with correct options', () => {
    expect(rateLimitMock).toHaveBeenCalledTimes(4);
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 10, windowMs: 15 * 60 * 1000 }),
    );
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 3, windowMs: 60 * 60 * 1000 }),
    );
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 30, windowMs: 15 * 60 * 1000 }),
    );
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 60, windowMs: 15 * 60 * 1000 }),
    );
  });

  it('configures photoLimiter with correct parameters', () => {
    expect(photoLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(photoLimiter.max).toBe(30);
    expect(photoLimiter.standardHeaders).toBe(true);
    expect(photoLimiter.legacyHeaders).toBe(false);
  });

  it('uses a PostgresRateLimitStore on every limiter', () => {
    expect(authLimiter.store).toBeInstanceOf(MockPostgresRateLimitStore);
    expect(signupLimiter.store).toBeInstanceOf(MockPostgresRateLimitStore);
    expect(photoLimiter.store).toBeInstanceOf(MockPostgresRateLimitStore);
    expect(writeLimiter.store).toBeInstanceOf(MockPostgresRateLimitStore);
  });
});
