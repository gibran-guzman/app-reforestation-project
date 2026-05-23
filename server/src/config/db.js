const { Pool } = require('pg');
const logger = require('../utils/logger');

const url = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port, 10),
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  family: 4,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
