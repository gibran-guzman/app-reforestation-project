const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const { runner } = require('node-pg-migrate');
const logger = require('../utils/logger');
const { buildPoolConfig } = require('../config/dbConnection');

const DIR = resolve(__dirname, 'migrations');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.fatal('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function run() {
  const pool = new Pool(buildPoolConfig(DATABASE_URL));

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
