const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const { runner } = require('node-pg-migrate');
const logger = require('../utils/logger');

const DIR = resolve(__dirname, 'migrations');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.fatal('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function run() {
  const sslMode = /[?&]sslmode=([^&#]+)/.exec(DATABASE_URL || '')?.[1];
  const strictSSL = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  const isSupabase = /supabase\.co/i.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: (sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full')
      ? { rejectUnauthorized: strictSSL && !isSupabase }
      : undefined,
  });

  try {
    await runner({
      dbClient: pool,
      dir: DIR,
      direction: 'up',
      migrationsTable: 'migrations',
      count: Infinity,
      migrationFileLanguage: 'sql',
      logger: {
        info: (msg) => logger.info(msg),
        warn: (msg) => logger.warn(msg),
        error: (msg) => logger.error(msg),
      },
    });
    logger.info('Migrations completed successfully');
  } catch (err) {
    logger.fatal({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
