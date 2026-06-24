export interface MonitoringRecord {
  id: number;
  planting_site_id: number;
  visit_date: string;
  ph: number | null;
  humidity: number | null;
  soil_texture: string | null;
  survival_status: 'alive' | 'struggling' | 'dead';
  vigor: 'high' | 'medium' | 'low' | null;
  notes: string | null;
  photo_url: string | null;
  monitored_by: string | null;
  created_at: string;
}

export interface CreateMonitoringRequest {
  planting_site_id: number;
  visit_date?: string;
  ph?: number;
  humidity?: number;
  soil_texture?: string;
  survival_status: 'alive' | 'struggling' | 'dead';
  vigor?: 'high' | 'medium' | 'low';
  notes?: string;
  photo_url?: string;
}
