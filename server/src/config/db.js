const { Pool } = require('pg');
const logger = require('../utils/logger');
const { buildPoolConfig } = require('./dbConnection');

let ssl;
if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true') {
  ssl = { rejectUnauthorized: true };
} else if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
  ssl = { rejectUnauthorized: false };
}

const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL, {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  ssl,
}));

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

module.exports = {
  query: (text, params) => pool.query(text, params),

  async withTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        logger.error({ err: rollbackErr }, 'Error al hacer rollback de la transacción');
      }
      throw err;
    } finally {
      client.release();
    }
  },
};
