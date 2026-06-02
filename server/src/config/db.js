const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
    ? { rejectUnauthorized: false }
    : process.env.DATABASE_URL?.includes('sslmode=require')
      ? undefined
      : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
