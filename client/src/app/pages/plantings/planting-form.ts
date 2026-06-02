import { Component, inject, NgZone, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, of, catchError } from 'rxjs';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { ConfigService, type SoilTexture } from '../../services/config.service';
import { ImageService } from '../../services/image.service';
import { GeolocationService } from '../../services/geolocation.service';
import type { Species, Zone } from '../../models';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
  private configService = inject(ConfigService);
  private imageService = inject(ImageService);
  private geolocationService = inject(GeolocationService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  speciesList: Species[] = [];
  zonesList: Zone[] = [];
  soilTextures: SoilTexture[] = [];
  loadingSpecies = true;
  loadingZones = true;
  loadingTextures = true;
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

  get latInvalid(): boolean {
    return this.touched.lat && (isNaN(this.form.lat) || this.form.lat < -90 || this.form.lat > 90 || this.form.lat === 0);
  }
  get lngInvalid(): boolean {
    return this.touched.lng && (isNaN(this.form.lng) || this.form.lng < -180 || this.form.lng > 180 || this.form.lng === 0);
  }

  ngOnInit() {
    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.speciesList = res.data; this.loadingSpecies = false; },
      error: () => { this.speciesError = 'No se pudieron cargar las especies'; this.loadingSpecies = false; },
    });
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.zonesList = res.data; this.loadingZones = false; },
      error: () => { this.zoneError = 'No se pudieron cargar las zonas'; this.loadingZones = false; },
    });
    this.configService.getSoilTextures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.soilTextures = res.data; this.loadingTextures = false; },
      error: () => { this.loadingTextures = false; },
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
    if (!this.geolocationService.isAvailable()) {
      this.gpsStatus = 'La geolocalización no está disponible en este navegador';
      return;
    }

    this.gpsStatus = 'Obteniendo ubicación...';
    this.gpsFailed = false;

    this.geolocationService.getCurrentPosition().then(
      (coords) => {
        this.ngZone.run(() => {
          this.setPosition(coords.lat, coords.lng);
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
    );
  }

  private placeMarker(lat: number, lng: number) {
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

  private setPosition(lat: number, lng: number) {
    this.placeMarker(lat, lng);
  }

  updateMarkerFromCoords() {
    if (this.form.lat === null || this.form.lng === null || isNaN(this.form.lat) || isNaN(this.form.lng)) return;
    this.placeMarker(this.form.lat, this.form.lng);
  }

  touchLat() { this.touched.lat = true; }
  touchLng() { this.touched.lng = true; }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const sizeError = this.imageService.validateSize(file);
    if (sizeError) {
      this.error = sizeError;
      input.value = '';
      return;
    }

    this.error = '';
    this.compressing = true;

    try {
      const compressed = await this.imageService.compress(file);
      this.photoFile = compressed;
      this.photoPreview = await this.imageService.readAsDataUrl(compressed);
      this.compressing = false;
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

    const create$ = this.plantingService.create(payload).pipe(
      switchMap((res) => {
        if (this.photoFile && res.data?.id) {
          this.uploading = true;
          return this.plantingService.uploadPhoto(res.data.id, this.photoFile).pipe(
            switchMap(() => of({ success: 'Plántula registrada con foto' })),
            catchError(() => of({ success: 'Plántula registrada, pero la foto no pudo subirse' })),
          );
        }
        return of({ success: 'Plántula registrada correctamente' });
      }),
      takeUntilDestroyed(this.destroyRef),
    );

    create$.subscribe({
      next: (msg) => this.router.navigate(['/dashboard'], { state: { success: msg.success } }),
      error: (err) => {
        this.error = err.error?.error || err.error?.details?.[0]?.message || 'Error al registrar plántula';
        this.saving = false;
      },
    });
  }
}
