export interface Zone {
  id: number;
  name: string;
  description: string | null;
  geometry: GeoJSON.Polygon;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneRequest {
  name: string;
  description?: string;
  geometry?: GeoJSON.Polygon;
}

export interface UpdateZoneRequest {
  name?: string;
  description?: string;
  geometry?: GeoJSON.Polygon;
}
