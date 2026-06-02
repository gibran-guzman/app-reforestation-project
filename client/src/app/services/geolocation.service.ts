import { Injectable } from '@angular/core';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  isAvailable(): boolean {
    return !!navigator.geolocation;
  }

  getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización no está disponible en este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
            lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
          });
        },
        () => {
          reject(new Error('No se pudo obtener la ubicación. Ingresa las coordenadas manualmente o intenta de nuevo.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options },
      );
    });
  }
}
