-- ================================================================
-- Migration 002: Add UNIQUE index for sync conflict resolution
-- Prevents duplicate planting_site rows from concurrent syncBatch
-- ================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_planting_sites_conflict
  ON planting_sites (zone_id, species_id, planted_at, planted_by);
