require('dotenv').config();

if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
}

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const speciesRoutes = require('./routes/speciesRoutes');
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const plantingRoutes = require('./routes/plantingRoutes');
const photoRoutes = require('./routes/photoRoutes');
const configRoutes = require('./routes/configRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { authLimiter, signupLimiter, writeLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const { ensureBucket } = require('./services/photoService');
const { REQUEST_BODY_LIMIT } = require('./config/constants');

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled Promise rejection — process exiting');
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(reason);
    } catch { /* ignore */ }
  }
  process.exit(1);
});

function startWorker() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  const isProduction = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  app.use(pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }));

  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "blob:", "data:", "https://*.tile.openstreetmap.org", "https://cdnjs.cloudflare.com", "https://*.supabase.co"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.ngrok.com"],
        connectSrc: ["'self'", "https://*.tile.openstreetmap.org"],
        fontSrc: ["'self'", "https://assets.ngrok.com"],
        objectSrc: ["'none'"],
      },
    } : false,
    strictTransportSecurity: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
  }));
  app.use(cors({
    origin: isProduction ? process.env.CORS_ORIGIN : (process.env.CORS_ORIGIN || 'http://localhost:4200'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use('/api', writeLimiter);

  const HEALTH_TIMEOUT_MS = 5000;

  const healthChecks = async () => {
    try {
      await db.query('SELECT 1');
    } catch {
      throw new Error('Database unreachable');
    }
  };

  app.get('/health', async (req, res, _next) => {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), HEALTH_TIMEOUT_MS);
      await Promise.race([
        healthChecks(),
        new Promise((_, reject) => {
          ac.signal.addEventListener('abort', () => reject(new Error('Health check timed out')));
        }),
      ]);
      clearTimeout(timer);
      res.json({ status: 'ok', service: 'Lloa Reforestation API' });
    } catch (err) {
      logger.error({ err: err.message }, 'Health check failed');
      res.status(503).json({ status: 'error', service: 'Lloa Reforestation API', detail: err.message });
    }
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', signupLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/species', speciesRoutes);
  app.use('/api/zones', zoneRoutes);
  app.use('/api/plantings', plantingRoutes);
  app.use('/api/plantings/:id/photo', photoRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/analytics', analyticsRoutes);

  if (isProduction) {
    const publicPath = path.resolve(__dirname, '../../public');
    app.use(express.static(publicPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.setupExpressErrorHandler(app);
  }

  app.use(errorHandler);

  const server = app.listen(PORT, async () => {
    logger.info({ port: PORT, pid: process.pid }, 'Worker started');
    server.requestTimeout = 30000;
    server.headersTimeout = 31000;
    try {
      await ensureBucket();
      logger.info('Bucket de almacenamiento listo');
    } catch (err) {
      logger.warn({ err }, 'No se pudo inicializar el bucket de almacenamiento');
    }
  });

  const gracefulShutdown = async (signal) => {
    logger.info({ signal, pid: process.pid }, 'Received shutdown signal');
    server.close(() => {
      logger.info({ pid: process.pid }, 'HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error({ pid: process.pid }, 'Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

const enableClustering = process.env.CLUSTER_ENABLED === 'true';
if (enableClustering && cluster.isPrimary) {
  const numWorkers = parseInt(process.env.WORKERS, 10) || os.cpus().length;
  logger.info({ workers: numWorkers }, 'Primary started, forking workers');
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    logger.warn({ pid: worker.process.pid, code, signal }, 'Worker died, restarting');
    cluster.fork();
  });
} else {
  startWorker();
}
