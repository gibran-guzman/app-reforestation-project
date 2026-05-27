import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, PlantingSite, CreatePlantingRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class PlantingService {
  private readonly api = '/api/plantings';

  constructor(private http: HttpClient) {}

  create(body: CreatePlantingRequest) {
    return this.http.post<ApiResponse<PlantingSite>>(this.api, body);
  }
}
