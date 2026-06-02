import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, MonitoringRecord, CreateMonitoringRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly api = '/api/monitoring';

  constructor(private http: HttpClient) {}

  getByPlantingSiteId(plantingSiteId: number) {
    return this.http.get<ApiResponse<MonitoringRecord[]>>(`${this.api}/planting/${plantingSiteId}`);
  }

  getById(id: number) {
    return this.http.get<ApiResponse<MonitoringRecord>>(`${this.api}/${id}`);
  }

  create(body: CreateMonitoringRequest) {
    return this.http.post<ApiResponse<MonitoringRecord>>(this.api, body);
  }
}
