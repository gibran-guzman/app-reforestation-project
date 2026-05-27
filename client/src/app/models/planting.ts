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
}

export interface CreatePlantingRequest {
  zone_id: number;
  species_id: number;
  location: { lat: number; lng: number };
  planted_at?: string;
  initial_ph?: number;
  initial_humidity?: number;
  initial_soil_texture?: string;
  photo?: File;
}
