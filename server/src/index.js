require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const speciesRoutes = require('./routes/speciesRoutes');
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const plantingRoutes = require('./routes/plantingRoutes');
const photoRoutes = require('./routes/photoRoutes');
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
app.use(express.json({ limit: '10kb' }));

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

app.use(errorHandler);

app.listen(PORT, async () => {
  logger.info({ port: PORT }, 'Servidor iniciado');
  try {
    await ensureBucket();
    logger.info('Bucket de almacenamiento listo');
  } catch (err) {
    logger.warn({ err }, 'No se pudo inicializar el bucket de almacenamiento');
  }
});
