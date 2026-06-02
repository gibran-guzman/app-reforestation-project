import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse } from '../models';

export interface SoilTexture {
  value: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  constructor(private http: HttpClient) {}

  getSoilTextures() {
    return this.http.get<ApiResponse<SoilTexture[]>>('/api/config/soil-textures');
  }
}
