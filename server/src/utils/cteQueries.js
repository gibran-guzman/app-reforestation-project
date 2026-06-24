/*
 * Shared CTE for obtaining the latest monitoring record per planting site.
 * Requires a composite index for efficient execution:
 *   CREATE INDEX idx_monitoring_site_visit
 *     ON monitoring_records (planting_site_id, visit_date DESC, created_at DESC);
 */
const latestMonitoringCte = `
  WITH latest_monitoring AS (
    SELECT DISTINCT ON (mr.planting_site_id)
      mr.planting_site_id, mr.survival_status, mr.visit_date
    FROM monitoring_records mr
    ORDER BY mr.planting_site_id, mr.visit_date DESC, mr.created_at DESC
  )
`;

module.exports = { latestMonitoringCte };
