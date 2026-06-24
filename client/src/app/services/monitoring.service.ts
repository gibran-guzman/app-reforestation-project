import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { ApiResponse, MonitoringRecord, CreateMonitoringRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/monitoring`;

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
