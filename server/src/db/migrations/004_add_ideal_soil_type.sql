-- ================================================================
-- Migration 004: Add ideal_soil_type column to species table
-- ================================================================

ALTER TABLE species ADD COLUMN IF NOT EXISTS ideal_soil_type VARCHAR(200);
