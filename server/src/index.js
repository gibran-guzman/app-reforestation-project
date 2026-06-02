require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const speciesRoutes = require('./routes/speciesRoutes');
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const plantingRoutes = require('./routes/plantingRoutes');
const photoRoutes = require('./routes/photoRoutes');
const configRoutes = require('./routes/configRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { authLimiter, signupLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { ensureBucket } = require('./services/photoService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Lloa Reforestation API' });
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

app.use(errorHandler);

const server = app.listen(PORT, async () => {
  logger.info({ port: PORT }, 'Servidor iniciado');
  try {
    await ensureBucket();
    logger.info('Bucket de almacenamiento listo');
  } catch (err) {
    logger.warn({ err }, 'No se pudo inicializar el bucket de almacenamiento');
  }
});

const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
