export interface Species {
  id: number;
  scientific_name: string;
  common_name: string;
  description: string | null;
  ideal_soil_type: string | null;
  recommended_altitude_min: number | null;
  recommended_altitude_max: number | null;
  created_at: string;
}

export interface CreateSpeciesRequest {
  scientific_name: string;
  common_name: string;
  description?: string;
  ideal_soil_type?: string;
  recommended_altitude_min?: number;
  recommended_altitude_max?: number;
}

export interface UpdateSpeciesRequest {
  scientific_name?: string;
  common_name?: string;
  description?: string;
  ideal_soil_type?: string;
  recommended_altitude_min?: number | null;
  recommended_altitude_max?: number | null;
}
