import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { buildFilterParams, type Filters } from '../helpers/filters';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface HeatmapPeriod {
  label: string;
  data: HeatmapPoint[];
}

export interface HeatmapResponse {
  periods: HeatmapPeriod[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/analytics`;

  getHeatmap(filters?: Filters) {
    const params = buildFilterParams(filters || {});
    return this.http.get<HeatmapResponse>(`${this.api}/heatmap`, { params });
  }
}
