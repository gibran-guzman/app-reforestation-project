import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { ApiResponse, Species, CreateSpeciesRequest, UpdateSpeciesRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SpeciesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/species`;

  list() {
    return this.http.get<ApiResponse<Species[]>>(this.api);
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Species>>(`${this.api}/${id}`);
  }

  create(body: CreateSpeciesRequest) {
    return this.http.post<ApiResponse<Species>>(this.api, body);
  }

  update(id: number, body: UpdateSpeciesRequest) {
    return this.http.put<ApiResponse<Species>>(`${this.api}/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete<ApiResponse<null>>(`${this.api}/${id}`);
  }
}
