import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

let pinoOpts;
const mockPino = vi.fn((opts) => {
  pinoOpts = opts;
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => mockPino()),
  };
});

function loadLogger(env) {
  const oldEnv = { ...process.env };
  Object.keys(env).forEach((k) => {
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  });

  try {
    pinoOpts = undefined;
    return proxyquire('./logger', {
      pino: mockPino,
    });
  } finally {
    Object.assign(process.env, oldEnv);
  }
}

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates logger with info level by default', () => {
    const logger = loadLogger({});

    expect(mockPino).toHaveBeenCalledTimes(1);
    expect(pinoOpts.level).toBe('info');
    expect(logger).toBeDefined();
  });

  it('uses LOG_LEVEL env var when set', () => {
    const logger = loadLogger({ LOG_LEVEL: 'debug' });

    expect(pinoOpts.level).toBe('debug');
    expect(logger).toBeDefined();
  });

  it('uses pino-pretty transport in non-production environment', () => {
    loadLogger({ NODE_ENV: 'development' });

    expect(pinoOpts.transport).toBeDefined();
    expect(pinoOpts.transport.target).toBe('pino-pretty');
    expect(pinoOpts.transport.options).toEqual({
      colorize: true,
      translateTime: 'SYS:standard',
    });
  });

  it('uses pino-pretty transport when NODE_ENV is not set', () => {
    loadLogger({});

    expect(pinoOpts.transport).toBeDefined();
    expect(pinoOpts.transport.target).toBe('pino-pretty');
  });

  it('sets transport to undefined in production', () => {
    loadLogger({ NODE_ENV: 'production' });

    expect(pinoOpts.transport).toBeUndefined();
  });

  it('redacts sensitive fields from log output', () => {
    loadLogger({});

    expect(pinoOpts.redact).toBeDefined();
    expect(pinoOpts.redact.censor).toBe('[REDACTED]');
    expect(pinoOpts.redact.paths).toEqual(
      expect.arrayContaining([
        'password',
        'encrypted_password',
        'refresh_token',
        'access_token',
        'req.headers.cookie',
        'req.headers.authorization',
      ]),
    );
  });
});
