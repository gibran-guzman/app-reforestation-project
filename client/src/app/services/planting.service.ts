import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { buildFilterParams, type Filters } from '../helpers/filters';
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
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/plantings`;

  list(page = 1, limit = 50, filters?: Filters) {
    let params = buildFilterParams(filters || {})
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<PaginatedResponse<PlantingSite[]>>(this.api, { params });
  }

  getGeoJson(filters?: Filters) {
    const params = filters ? buildFilterParams(filters) : new HttpParams();
    return this.http.get<GeoJsonFeatureCollection>(`${this.api}/geojson`, { params });
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

  uploadPhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post<ApiResponse<{ photo_url: string }>>(`${this.api}/${id}/photo`, fd);
  }
}
