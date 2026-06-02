import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

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
  private readonly api = '/api/analytics';

  constructor(private http: HttpClient) {}

  getHeatmap(filters?: { zone_id?: number; species_id?: number; from?: string; to?: string; interval?: string }) {
    let params = new HttpParams();
    if (filters?.zone_id) params = params.set('zone_id', String(filters.zone_id));
    if (filters?.species_id) params = params.set('species_id', String(filters.species_id));
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.interval) params = params.set('interval', filters.interval);
    return this.http.get<HeatmapResponse>(`${this.api}/heatmap`, { params });
  }
}
