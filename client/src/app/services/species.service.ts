import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse, Species, CreateSpeciesRequest, UpdateSpeciesRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SpeciesService {
  private readonly api = '/api/species';

  constructor(private http: HttpClient) {}

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
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
