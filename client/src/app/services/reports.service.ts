import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { buildFilterParams, type Filters } from '../helpers/filters';
import type { ApiResponse, SurvivalReport, SpeciesStat, ZoneSummary, EvolutionPoint } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reports`;

  getSurvivalRate(filters?: Filters) {
    return this.http.get<ApiResponse<SurvivalReport>>(`${this.api}/survival-rate`, { params: buildFilterParams(filters || {}) });
  }

  getSpeciesStats(filters?: Filters) {
    return this.http.get<ApiResponse<SpeciesStat[]>>(`${this.api}/species-stats`, { params: buildFilterParams(filters || {}) });
  }

  getZoneSummary(filters?: Filters) {
    return this.http.get<ApiResponse<ZoneSummary[]>>(`${this.api}/zone-summary`, { params: buildFilterParams(filters || {}) });
  }

  getEvolution(filters?: Filters) {
    return this.http.get<ApiResponse<EvolutionPoint[]>>(`${this.api}/planting-evolution`, { params: buildFilterParams(filters || {}) });
  }

  exportPdf(filters?: Filters) {
    return this.http.get(`${this.api}/export/pdf`, { params: buildFilterParams(filters || {}), responseType: 'blob' });
  }
}
