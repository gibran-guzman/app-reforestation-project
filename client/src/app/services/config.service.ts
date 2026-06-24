import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { ApiResponse } from '../models';

export interface SoilTexture {
  value: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/config`;

  getSoilTextures() {
    return this.http.get<ApiResponse<SoilTexture[]>>(`${this.api}/soil-textures`);
  }
}
