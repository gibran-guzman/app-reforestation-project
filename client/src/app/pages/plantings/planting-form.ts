import { Component, inject, NgZone, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import type { Species, Zone } from '../../models';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SOIL_TEXTURES = [
  { value: 'sandy', label: 'Arenoso' },
  { value: 'loamy', label: 'Franco' },
  { value: 'clay', label: 'Arcilloso' },
  { value: 'silty', label: 'Limoso' },
  { value: 'peaty', label: 'Turboso' },
  { value: 'chalky', label: 'Calcáreo' },
];

const MAX_IMAGE_WIDTH = 1200;
const COMPRESS_QUALITY = 0.8;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round(height * MAX_IMAGE_WIDTH / width);
        width = MAX_IMAGE_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Error al comprimir la imagen')); return; }
        const name = file.name.replace(/\.[^.]+$/, '.webp');
        resolve(new File([blob], name, { type: 'image/webp' }));
      }, 'image/webp', COMPRESS_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar la imagen')); };
    img.src = url;
  });
}

@Component({
  selector: 'app-planting-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './planting-form.html',
  styleUrl: './planting-form.scss',
})
export default class PlantingForm implements OnInit, AfterViewInit, OnDestroy {
  private plantingService = inject(PlantingService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private connectivity = inject(ConnectivityService);
  private offline = inject(OfflineService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  speciesList: Species[] = [];
  zonesList: Zone[] = [];
  loadingSpecies = true;
  loadingZones = true;
  speciesError = '';
  zoneError = '';
  saving = false;
  uploading = false;
  offlineSave = false;
  error = '';
  gpsStatus = '';
  gpsFailed = false;

  photoFile: File | null = null;
  photoPreview: string | null = null;
  compressing = false;

  touched = { lat: false, lng: false };

  form = {
    species_id: 0,
    zone_id: 0,
    lat: 0,
    lng: 0,
    planted_at: new Date().toISOString().split('T')[0],
    initial_ph: null as number | null,
    initial_humidity: null as number | null,
    initial_soil_texture: '',
  };

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  readonly soilTextures = SOIL_TEXTURES;

  get latInvalid(): boolean {
    return this.touched.lat && (isNaN(this.form.lat) || this.form.lat < -90 || this.form.lat > 90 || this.form.lat === 0);
  }
  get lngInvalid(): boolean {
    return this.touched.lng && (isNaN(this.form.lng) || this.form.lng < -180 || this.form.lng > 180 || this.form.lng === 0);
  }

  ngOnInit() {
    this.speciesService.list().subscribe({
      next: (res) => { this.speciesList = res.data; this.loadingSpecies = false; },
      error: () => { this.speciesError = 'No se pudieron cargar las especies'; this.loadingSpecies = false; },
    });
    this.zoneService.list().subscribe({
      next: (res) => { this.zonesList = res.data; this.loadingZones = false; },
      error: () => { this.zoneError = 'No se pudieron cargar las zonas'; this.loadingZones = false; },
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-0.229, -78.524],
      zoom: 12,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => this.setPosition(e.latlng.lat, e.latlng.lng));
    });

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  captureGps() {
    if (!navigator.geolocation) {
      this.gpsStatus = 'La geolocalización no está disponible en este navegador';
      return;
    }

    this.gpsStatus = 'Obteniendo ubicación...';
    this.gpsFailed = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ngZone.run(() => {
          this.setPosition(pos.coords.latitude, pos.coords.longitude);
          this.touched.lat = true;
          this.touched.lng = true;
          this.gpsStatus = 'Ubicación capturada correctamente';
        });
      },
      () => {
        this.ngZone.run(() => {
          this.gpsFailed = true;
          this.gpsStatus = 'No se pudo obtener la ubicación. Ingresa las coordenadas manualmente o intenta de nuevo.';
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  private setPosition(lat: number, lng: number) {
    this.form.lat = Math.round(lat * 1000000) / 1000000;
    this.form.lng = Math.round(lng * 1000000) / 1000000;

    if (this.marker) {
      this.marker.setLatLng([this.form.lat, this.form.lng]);
    } else if (this.map) {
      this.marker = L.marker([this.form.lat, this.form.lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.ngZone.run(() => {
          this.form.lat = Math.round(pos.lat * 1000000) / 1000000;
          this.form.lng = Math.round(pos.lng * 1000000) / 1000000;
        });
      });
    }

    this.map?.setView([this.form.lat, this.form.lng], 16);
  }

  updateMarkerFromCoords() {
    if (this.form.lat === null || this.form.lng === null || isNaN(this.form.lat) || isNaN(this.form.lng)) return;

    if (this.marker) {
      this.marker.setLatLng([this.form.lat, this.form.lng]);
    } else if (this.map) {
      this.marker = L.marker([this.form.lat, this.form.lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.ngZone.run(() => {
          this.form.lat = Math.round(pos.lat * 1000000) / 1000000;
          this.form.lng = Math.round(pos.lng * 1000000) / 1000000;
        });
      });
    }

    this.map?.setView([this.form.lat, this.form.lng], 16);
  }

  touchLat() { this.touched.lat = true; }
  touchLng() { this.touched.lng = true; }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.error = 'La foto no puede superar los 5 MB';
      input.value = '';
      return;
    }

    this.error = '';
    this.compressing = true;

    try {
      const compressed = await compressImage(file);
      this.photoFile = compressed;

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.compressing = false;
      };
      reader.readAsDataURL(compressed);
    } catch {
      this.error = 'Error al procesar la imagen';
      this.compressing = false;
    }
  }

  removePhoto() {
    this.photoFile = null;
    this.photoPreview = null;
  }

  submit() {
    this.error = '';
    this.saving = true;
    this.offlineSave = false;

    this.updateMarkerFromCoords();

    const payload = {
      zone_id: this.form.zone_id,
      species_id: this.form.species_id,
      location: { lat: this.form.lat, lng: this.form.lng },
      planted_at: this.form.planted_at || undefined,
      initial_ph: this.form.initial_ph ?? undefined,
      initial_humidity: this.form.initial_humidity ?? undefined,
      initial_soil_texture: this.form.initial_soil_texture || undefined,
    };

    if (!this.connectivity.online()) {
      this.offline.savePlanting(payload, this.photoFile ?? undefined).then(() => {
        this.offlineSave = true;
        this.saving = false;
        this.router.navigate(['/dashboard'], { state: { success: 'Plántula guardada offline. Se sincronizará al recuperar conexión.' } });
      });
      return;
    }

    this.plantingService.create(payload).subscribe({
      next: (res) => {
        if (this.photoFile && res.data?.id) {
          this.uploading = true;
          this.plantingService.uploadPhoto(res.data.id, this.photoFile).subscribe({
            next: () => this.router.navigate(['/dashboard'], { state: { success: 'Plántula registrada con foto' } }),
            error: () => this.router.navigate(['/dashboard'], { state: { success: 'Plántula registrada' } }),
          });
        } else {
          this.router.navigate(['/dashboard'], { state: { success: 'Plántula registrada correctamente' } });
        }
      },
      error: (err) => {
        this.error = err.error?.error || err.error?.details?.[0]?.message || 'Error al registrar plántula';
        this.saving = false;
      },
    });
  }
}
