export interface PlantingSite {
  id: number;
  zone_id: number;
  species_id: number;
  location: GeoJSON.Point;
  planted_at: string;
  planted_by: string | null;
  initial_ph: number | null;
  initial_humidity: number | null;
  initial_soil_texture: string | null;
  photo_url: string | null;
  created_at: string;
  species_name?: string;
  zone_name?: string;
}

export interface CreatePlantingRequest {
  zone_id: number;
  species_id: number;
  location: { lat: number; lng: number };
  planted_at?: string;
  initial_ph?: number;
  initial_humidity?: number;
  initial_soil_texture?: string;
}

export interface GeoJsonProperties {
  planting_id: number;
  species_name: string;
  scientific_name: string;
  zone_name: string;
  planted_at: string;
  survival_status: 'alive' | 'struggling' | 'dead' | 'unmonitored';
  last_monitoring_date: string | null;
  initial_ph: number | null;
  initial_humidity: number | null;
  photo_url: string | null;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJSON.Point;
  properties: GeoJsonProperties;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}
