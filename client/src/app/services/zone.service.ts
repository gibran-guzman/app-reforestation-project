import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { ApiResponse, Zone, CreateZoneRequest, UpdateZoneRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/zones`;

  list() {
    return this.http.get<ApiResponse<Zone[]>>(this.api);
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Zone>>(`${this.api}/${id}`);
  }

  create(body: CreateZoneRequest) {
    return this.http.post<ApiResponse<Zone>>(this.api, body);
  }

  update(id: number, body: UpdateZoneRequest) {
    return this.http.put<ApiResponse<Zone>>(`${this.api}/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<ApiResponse<null>>(`${this.api}/${id}`);
  }
}
