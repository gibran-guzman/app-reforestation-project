import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { ApiResponse, SurvivalReport, SpeciesStat, ZoneSummary } from '../models';

type ReportFilters = { zone_id?: number; species_id?: number; from?: string; to?: string };

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = '/api/reports';

  constructor(private http: HttpClient) {}

  private buildParams(filters?: ReportFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.zone_id) params = params.set('zone_id', String(filters.zone_id));
    if (filters?.species_id) params = params.set('species_id', String(filters.species_id));
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return params;
  }

  getSurvivalRate(filters?: ReportFilters) {
    return this.http.get<ApiResponse<SurvivalReport>>(`${this.api}/survival-rate`, { params: this.buildParams(filters) });
  }

  getSpeciesStats(filters?: ReportFilters) {
    return this.http.get<ApiResponse<SpeciesStat[]>>(`${this.api}/species-stats`, { params: this.buildParams(filters) });
  }

  getZoneSummary(filters?: ReportFilters) {
    return this.http.get<ApiResponse<ZoneSummary[]>>(`${this.api}/zone-summary`, { params: this.buildParams(filters) });
  }

  exportPdf(filters?: ReportFilters) {
    return this.http.get(`${this.api}/export/pdf`, { params: this.buildParams(filters), responseType: 'blob' });
  }
}
