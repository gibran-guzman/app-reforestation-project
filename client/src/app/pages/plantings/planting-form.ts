import { Component, inject, OnInit, AfterViewInit, viewChild, ElementRef, DestroyRef, ChangeDetectionStrategy, signal, computed } from '@angular/core';
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
import { extractErrorMessage } from '../../helpers/api-error';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../constants/map';
import '../../helpers/leaflet';
import type { Species, Zone } from '../../models';
import L from 'leaflet';

@Component({
  selector: 'app-planting-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './planting-form.html',
  styleUrl: './planting-form.scss',
})
export default class PlantingForm implements OnInit, AfterViewInit {
  private plantingService = inject(PlantingService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private connectivity = inject(ConnectivityService);
  private offline = inject(OfflineService);
  private configService = inject(ConfigService);
  private imageService = inject(ImageService);
  private geolocationService = inject(GeolocationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly mapContainer = viewChild.required<ElementRef>('mapContainer');
  readonly photoInput = viewChild.required<ElementRef<HTMLInputElement>>('photoInput');

  speciesList = signal<Species[]>([]);
  zonesList = signal<Zone[]>([]);
  soilTextures = signal<SoilTexture[]>([]);
  loadingSpecies = signal(true);
  loadingZones = signal(true);
  loadingTextures = signal(true);
  speciesError = signal('');
  zoneError = signal('');
  saving = signal(false);
  uploading = signal(false);
  offlineSave = signal(false);
  error = signal('');
  gpsStatus = signal('');
  gpsFailed = signal(false);
  coordsSet = signal(false);

  photoFile = signal<File | null>(null);
  photoPreview = signal<string | null>(null);
  compressing = signal(false);

  readonly touchedLat = signal(false);
  readonly touchedLng = signal(false);

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

  readonly latInvalid = computed(() => {
    return this.touchedLat() && (isNaN(this.form.lat) || this.form.lat < -90 || this.form.lat > 90 || (!this.coordsSet() && this.form.lat === 0));
  });
  readonly lngInvalid = computed(() => {
    return this.touchedLng() && (isNaN(this.form.lng) || this.form.lng < -180 || this.form.lng > 180 || (!this.coordsSet() && this.form.lng === 0));
  });

  ngOnInit() {
    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.speciesList.set(res.data); this.loadingSpecies.set(false); },
      error: () => { this.speciesError.set('No se pudieron cargar las especies'); this.loadingSpecies.set(false); },
    });
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.zonesList.set(res.data); this.loadingZones.set(false); },
      error: () => { this.zoneError.set('No se pudieron cargar las zonas'); this.loadingZones.set(false); },
    });
    this.configService.getSoilTextures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => { this.soilTextures.set(res.data); this.loadingTextures.set(false); },
      error: () => { this.loadingTextures.set(false); },
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer().nativeElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setPosition(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  captureGps() {
    if (!this.geolocationService.isAvailable()) {
      this.gpsStatus.set('La geolocalización no está disponible en este navegador');
      return;
    }

    this.gpsStatus.set('Obteniendo ubicación...');
    this.gpsFailed.set(false);

    this.geolocationService.getCurrentPosition().then(
      (coords) => {
        this.setPosition(coords.lat, coords.lng);
        this.touchedLat.set(true);
        this.touchedLng.set(true);
        this.gpsStatus.set('Ubicación capturada correctamente');
      },
      () => {
        this.gpsFailed.set(true);
        this.gpsStatus.set('No se pudo obtener la ubicación. Ingresa las coordenadas manualmente o intenta de nuevo.');
      },
    );
  }

  private placeMarker(lat: number, lng: number) {
    this.coordsSet.set(true);
    this.form.lat = Math.round(lat * 1000000) / 1000000;
    this.form.lng = Math.round(lng * 1000000) / 1000000;

    if (this.marker) {
      this.marker.setLatLng([this.form.lat, this.form.lng]);
    } else if (this.map) {
      this.marker = L.marker([this.form.lat, this.form.lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.form.lat = Math.round(pos.lat * 1000000) / 1000000;
        this.form.lng = Math.round(pos.lng * 1000000) / 1000000;
      });
    }

    this.map?.setView([this.form.lat, this.form.lng], 16);
  }

  private setPosition(lat: number, lng: number) {
    this.placeMarker(lat, lng);
  }

  updateMarkerFromCoords() {
    if (this.form.lat === null || this.form.lng === null || isNaN(this.form.lat) || isNaN(this.form.lng)) return;
    this.coordsSet.set(true);
    this.placeMarker(this.form.lat, this.form.lng);
  }

  touchLat() { this.touchedLat.set(true); }
  touchLng() { this.touchedLng.set(true); }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const sizeError = this.imageService.validateSize(file);
    if (sizeError) {
      this.error.set(sizeError);
      input.value = '';
      return;
    }

    this.error.set('');
    this.compressing.set(true);

    try {
      const compressed = await this.imageService.compress(file);
      this.photoFile.set(compressed);
      this.photoPreview.set(await this.imageService.readAsDataUrl(compressed));
      this.compressing.set(false);
    } catch {
      this.error.set('Error al procesar la imagen');
      this.compressing.set(false);
    }
  }

  removePhoto() {
    this.photoFile.set(null);
    this.photoPreview.set(null);
  }

  onPhotoZoneKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.photoInput().nativeElement.click();
    }
  }

  submit() {
    this.error.set('');
    this.saving.set(true);
    this.offlineSave.set(false);

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
      this.offline.savePlanting(payload, this.photoFile() ?? undefined).then(() => {
        this.offlineSave.set(true);
        this.saving.set(false);
        this.router.navigate(['/dashboard'], { state: { success: 'Plántula guardada offline. Se sincronizará al recuperar conexión.' } });
      });
      return;
    }

    const create$ = this.plantingService.create(payload).pipe(
      switchMap((res) => {
        if (this.photoFile() && res.data?.id) {
          this.uploading.set(true);
          return this.plantingService.uploadPhoto(res.data.id, this.photoFile()!).pipe(
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
        this.error.set(extractErrorMessage(err, 'Error al registrar plántula'));
        this.saving.set(false);
      },
    });
  }
}
