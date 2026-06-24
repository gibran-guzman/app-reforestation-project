import { HttpParams } from '@angular/common/http';

export interface Filters {
  zone_id?: number;
  species_id?: number;
  from?: string;
  to?: string;
  interval?: string;
}

export function buildFilterParams(filters: Filters): HttpParams {
  let params = new HttpParams();
  if (filters.zone_id != null) params = params.set('zone_id', String(filters.zone_id));
  if (filters.species_id != null) params = params.set('species_id', String(filters.species_id));
  if (filters.from) params = params.set('from', filters.from);
  if (filters.to) params = params.set('to', filters.to);
  if (filters.interval) params = params.set('interval', filters.interval);
  return params;
}
