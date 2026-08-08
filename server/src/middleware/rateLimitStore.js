const db = require('../config/db');

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

class PostgresRateLimitStore {
  constructor({ windowMs }) {
    this.windowMs = windowMs;
    this.localKeys = false;
    this._cleanupTimer = null;
  }

  async init() {
    this._cleanupTimer = setInterval(() => {
      db.query('DELETE FROM rate_limits WHERE reset_at <= now()').catch(() => {});
    }, CLEANUP_INTERVAL_MS);
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  async increment(key) {
    const { rows } = await db.query(
      `INSERT INTO rate_limits (key, total_hits, reset_at)
       VALUES ($1, 1, now() + ($2::int || ' milliseconds')::interval)
       ON CONFLICT (key) DO UPDATE SET
         total_hits = CASE
           WHEN rate_limits.reset_at <= now() THEN 1
           ELSE rate_limits.total_hits + 1
         END,
         reset_at = CASE
           WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at
           ELSE rate_limits.reset_at
         END
       RETURNING total_hits, reset_at`,
      [key, this.windowMs],
    );
    const row = rows[0];
    return { totalHits: row.total_hits, resetTime: row.reset_at };
  }

  async decrement(key) {
    await db.query(
      'UPDATE rate_limits SET total_hits = GREATEST(total_hits - 1, 0) WHERE key = $1',
      [key],
    );
  }

  async get(key) {
    const { rows } = await db.query(
      'SELECT total_hits, reset_at FROM rate_limits WHERE key = $1 AND reset_at > now()',
      [key],
    );
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return { totalHits: row.total_hits, resetTime: row.reset_at };
  }

  async resetKey(key) {
    await db.query('DELETE FROM rate_limits WHERE key = $1', [key]);
  }

  async resetAll() {
    await db.query('DELETE FROM rate_limits');
  }

  async shutdown() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }
}

module.exports = { PostgresRateLimitStore };
