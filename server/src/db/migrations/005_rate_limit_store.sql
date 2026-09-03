-- ================================================================
-- Migration 005: Rate limit store (compartido entre workers/cluster)
-- Backing table para el store PostgreSQL del rate limiter.
-- ================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key        TEXT PRIMARY KEY,
  total_hits INTEGER NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
  ON rate_limits (reset_at);
