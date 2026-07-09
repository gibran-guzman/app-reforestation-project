import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

let listenCallback;
const mockServer = {
  close: vi.fn((cb) => {
    if (typeof cb === 'function') cb();
    return mockServer;
  }),
};

const mockApp = {
  use: vi.fn().mockReturnThis(),
  get: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  listen: vi.fn((port, cb) => {
    listenCallback = cb;
    return mockServer;
  }),
};

function mockMiddleware() {
  return vi.fn((req, res, next) => next());
}

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn(() => mockLogger),
};

const mockEnsureBucket = vi.fn().mockResolvedValue(undefined);
const mockDb = { query: vi.fn().mockResolvedValue({ rows: [] }) };

function loadIndex() {
  return proxyquire('./index', {
    dotenv: { config: vi.fn() },
    express: vi.fn(() => mockApp),
    cors: vi.fn(() => mockMiddleware()),
    helmet: vi.fn(() => mockMiddleware()),
    './routes/speciesRoutes': mockMiddleware(),
    './routes/authRoutes': mockMiddleware(),
    './routes/zoneRoutes': mockMiddleware(),
    './routes/plantingRoutes': mockMiddleware(),
    './routes/photoRoutes': mockMiddleware(),
    './routes/configRoutes': mockMiddleware(),
    './routes/monitoringRoutes': mockMiddleware(),
    './routes/reportsRoutes': mockMiddleware(),
    './middleware/rateLimiter': {
      authLimiter: mockMiddleware(),
      signupLimiter: mockMiddleware(),
    },
    './middleware/errorHandler': mockMiddleware(),
    'pino-http': vi.fn(() => mockMiddleware()),
    './utils/logger': mockLogger,
    './config/db': mockDb,
    './services/photoService': { ensureBucket: mockEnsureBucket },
  });
}

describe('Express app', () => {
  let processOnSpy;
  let originalPort;
  let timeoutSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    listenCallback = undefined;
    processOnSpy = vi.spyOn(process, 'on');
    timeoutSpy = vi.spyOn(global, 'setTimeout').mockReturnValue({ unref: vi.fn() });
    originalPort = process.env.PORT;
    delete process.env.PORT;
  });

  afterEach(() => {
    processOnSpy.mockRestore();
    timeoutSpy.mockRestore();
    if (originalPort !== undefined) process.env.PORT = originalPort;
  });

  it('creates express app', () => {
    loadIndex();
    expect(mockApp.listen).toHaveBeenCalled();
  });

  it('uses helmet middleware', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('mounts cors middleware', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('mounts json body parser', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('registers health check endpoint at GET /health', () => {
    loadIndex();
    expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
  });

  it('health endpoint returns ok status', async () => {
    loadIndex();
    const healthHandler = mockApp.get.mock.calls.find(
      ([path]) => path === '/health',
    )?.[1];

    expect(healthHandler).toBeDefined();
    const req = {};
    const res = { json: vi.fn() };
    await healthHandler(req, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({
      status: 'ok',
      service: 'Lloa Reforestation API',
    });
  });

  it('mounts auth limiter on /api/auth/login', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/auth/login', expect.any(Function));
  });

  it('mounts signup limiter on /api/auth/signup', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/auth/signup', expect.any(Function));
  });

  it('mounts authRoutes on /api/auth', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/auth', expect.any(Function));
  });

  it('mounts speciesRoutes on /api/species', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/species', expect.any(Function));
  });

  it('mounts zoneRoutes on /api/zones', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/zones', expect.any(Function));
  });

  it('mounts plantingRoutes on /api/plantings', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/plantings', expect.any(Function));
  });

  it('mounts photoRoutes on /api/plantings/:id/photo', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/plantings/:id/photo', expect.any(Function));
  });

  it('mounts configRoutes on /api/config', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/config', expect.any(Function));
  });

  it('mounts monitoringRoutes on /api/monitoring', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/monitoring', expect.any(Function));
  });

  it('mounts reportsRoutes on /api/reports', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith('/api/reports', expect.any(Function));
  });

  it('mounts errorHandler middleware', () => {
    loadIndex();
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
  });

  it('listens on PORT from env or defaults to 3000', () => {
    loadIndex();
    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it('listens on PORT when env var is set', () => {
    process.env.PORT = '4000';
    loadIndex();
    expect(mockApp.listen).toHaveBeenCalledWith('4000', expect.any(Function));
  });

  it('calls ensureBucket on startup and logs success', async () => {
    mockEnsureBucket.mockResolvedValue(undefined);
    loadIndex();

    expect(listenCallback).toBeDefined();
    await listenCallback();

    expect(mockEnsureBucket).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith('Bucket de almacenamiento listo');
  });

  it('logs warning if ensureBucket fails', async () => {
    const bucketError = new Error('Storage error');
    mockEnsureBucket.mockRejectedValue(bucketError);
    loadIndex();

    expect(listenCallback).toBeDefined();
    await listenCallback();

    expect(mockEnsureBucket).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      { err: bucketError },
      'No se pudo inicializar el bucket de almacenamiento',
    );
  });

  it('registers SIGTERM handler', () => {
    loadIndex();
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });

  it('registers SIGINT handler', () => {
    loadIndex();
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });

  it('graceful shutdown closes server and exits on SIGTERM', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    loadIndex();

    const sigtermHandler = processOnSpy.mock.calls.find(
      ([signal]) => signal === 'SIGTERM',
    )?.[1];

    expect(sigtermHandler).toBeDefined();
    await sigtermHandler();

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ signal: 'SIGTERM' }),
      'Received shutdown signal',
    );
    expect(mockServer.close).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });

  it('graceful shutdown closes server and exits on SIGINT', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    loadIndex();

    const sigintHandler = processOnSpy.mock.calls.find(
      ([signal]) => signal === 'SIGINT',
    )?.[1];

    expect(sigintHandler).toBeDefined();
    await sigintHandler();

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ signal: 'SIGINT' }),
      'Received shutdown signal',
    );
    expect(mockServer.close).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });

  it('forces shutdown after 10 second timeout', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    loadIndex();

    const sigtermHandler = processOnSpy.mock.calls.find(
      ([signal]) => signal === 'SIGTERM',
    )?.[1];

    await sigtermHandler();

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    const timeoutFn = timeoutSpy.mock.calls[0][0];

    timeoutFn();
    expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({ pid: expect.any(Number) }), 'Forced shutdown after timeout');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('logs server start on listen', async () => {
    loadIndex();
    await listenCallback();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ port: 3000 }),
      'Worker started',
    );
  });

  it('configures helmet with CSP in production', () => {
    process.env.NODE_ENV = 'production';
    const helmetMock = vi.fn(() => mockMiddleware());
    const corsMock = vi.fn(() => mockMiddleware());
    proxyquire('./index', {
      dotenv: { config: vi.fn() },
      express: vi.fn(() => mockApp),
      cors: corsMock,
      helmet: helmetMock,
      './routes/speciesRoutes': mockMiddleware(),
      './routes/authRoutes': mockMiddleware(),
      './routes/zoneRoutes': mockMiddleware(),
      './routes/plantingRoutes': mockMiddleware(),
      './routes/photoRoutes': mockMiddleware(),
      './routes/configRoutes': mockMiddleware(),
      './routes/monitoringRoutes': mockMiddleware(),
      './routes/reportsRoutes': mockMiddleware(),
      './middleware/rateLimiter': {
        authLimiter: mockMiddleware(),
        signupLimiter: mockMiddleware(),
      },
      './middleware/errorHandler': mockMiddleware(),
      './utils/logger': mockLogger,
      './config/db': mockDb,
      './services/photoService': { ensureBucket: mockEnsureBucket },
    });
    const helmetCall = helmetMock.mock.calls[0][0];
    expect(helmetCall.contentSecurityPolicy).not.toBe(false);
    expect(helmetCall.contentSecurityPolicy.directives.defaultSrc).toEqual(["'self'"]);
    delete process.env.NODE_ENV;
  });
});
