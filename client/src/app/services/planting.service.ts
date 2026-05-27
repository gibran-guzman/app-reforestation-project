import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, PlantingSite, CreatePlantingRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class PlantingService {
  private readonly api = '/api/plantings';

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<ApiResponse<PlantingSite[]>>(this.api);
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
