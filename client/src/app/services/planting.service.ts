import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { ApiResponse, PaginatedResponse, PlantingSite, CreatePlantingRequest, GeoJsonFeatureCollection } from '../models';

export interface SyncResult {
  index: number;
  status: 'success' | 'error';
  data?: PlantingSite;
  error?: string;
  conflict?: 'resolved';
}

export interface SyncBatchResponse {
  data: SyncResult[];
}

@Injectable({ providedIn: 'root' })
export class PlantingService {
  private readonly api = '/api/plantings';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 50, filters?: { zone_id?: number; species_id?: number; from?: string; to?: string }) {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (filters?.zone_id) params = params.set('zone_id', String(filters.zone_id));
    if (filters?.species_id) params = params.set('species_id', String(filters.species_id));
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<PaginatedResponse<PlantingSite[]>>(this.api, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<PlantingSite>>(`${this.api}/${id}`);
  }

  create(body: CreatePlantingRequest) {
    return this.http.post<ApiResponse<PlantingSite>>(this.api, body);
  }

  syncBatch(items: CreatePlantingRequest[]) {
    return this.http.post<SyncBatchResponse>(`${this.api}/sync`, { items });
  }

  getGeoJson(filters?: { zone_id?: number; species_id?: number; from?: string; to?: string }) {
    let params = new HttpParams();
    if (filters?.zone_id) params = params.set('zone_id', String(filters.zone_id));
    if (filters?.species_id) params = params.set('species_id', String(filters.species_id));
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<GeoJsonFeatureCollection>(`${this.api}/geojson`, { params });
  }

  uploadPhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post<ApiResponse<{ photo_url: string }>>(`${this.api}/${id}/photo`, fd);
  }
}
