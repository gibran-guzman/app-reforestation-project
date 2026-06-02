import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { ApiResponse, PaginatedResponse, PlantingSite, CreatePlantingRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class PlantingService {
  private readonly api = '/api/plantings';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 50) {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<PaginatedResponse<PlantingSite[]>>(this.api, { params });
  }

  create(body: CreatePlantingRequest) {
    return this.http.post<ApiResponse<PlantingSite>>(this.api, body);
  }

  uploadPhoto(id: number, file: File) {
    const fd = new FormData();
    fd.append('photo', file);
    return this.http.post<ApiResponse<{ photo_url: string }>>(`${this.api}/${id}/photo`, fd);
  }
}
