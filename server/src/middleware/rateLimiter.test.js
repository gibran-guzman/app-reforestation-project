import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const rateLimitMock = vi.fn((opts) => ({
  ...opts,
  resetKey: vi.fn(),
  getKey: vi.fn(),
}));

const { authLimiter, signupLimiter } = proxyquire('./rateLimiter', {
  'express-rate-limit': rateLimitMock,
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

  it('has error messages in Spanish', () => {
    expect(authLimiter.message.error).toContain('Demasiadas');
    expect(signupLimiter.message.error).toContain('Demasiados');
  });

  it('calls rateLimit twice with correct options', () => {
    expect(rateLimitMock).toHaveBeenCalledTimes(2);
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 10, windowMs: 15 * 60 * 1000 }),
    );
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ max: 3, windowMs: 60 * 60 * 1000 }),
    );
  });
});
