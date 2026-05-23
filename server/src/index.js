require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const speciesRoutes = require('./routes/speciesRoutes');
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

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

app.use('/api/auth', authRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/zones', zoneRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});
