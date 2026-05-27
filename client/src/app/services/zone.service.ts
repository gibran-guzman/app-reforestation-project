import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, Zone, CreateZoneRequest, UpdateZoneRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly api = '/api/zones';

  constructor(private http: HttpClient) {}

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
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
