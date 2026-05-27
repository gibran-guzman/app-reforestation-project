import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
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

@Component({
  selector: 'app-planting-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './planting-form.html',
})
export default class PlantingForm implements OnInit, AfterViewInit, OnDestroy {
  private plantingService = inject(PlantingService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private router = inject(Router);

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  speciesList: Species[] = [];
  zonesList: Zone[] = [];
  loadingSpecies = true;
  loadingZones = true;
  saving = false;
  error = '';
  gpsStatus = '';

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

  ngOnInit() {
    this.speciesService.list().subscribe({
      next: (res) => { this.speciesList = res.data; this.loadingSpecies = false; },
      error: () => { this.loadingSpecies = false; },
    });
    this.zoneService.list().subscribe({
      next: (res) => { this.zonesList = res.data; this.loadingZones = false; },
      error: () => { this.loadingZones = false; },
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-0.229, -78.524],
      zoom: 12,
      attributionControl: false,
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

  ngOnDestroy() {
    this.map?.remove();
  }

  captureGps() {
    if (!navigator.geolocation) {
      this.gpsStatus = 'La geolocalización no está disponible en este navegador';
      return;
    }

    this.gpsStatus = 'Obteniendo ubicación...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.setPosition(pos.coords.latitude, pos.coords.longitude);
        this.gpsStatus = 'Ubicación capturada correctamente';
      },
      () => {
        this.gpsStatus = 'No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.';
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  private setPosition(lat: number, lng: number) {
    this.form.lat = Math.round(lat * 6) / 6;
    this.form.lng = Math.round(lng * 6) / 6;

    if (this.marker) {
      this.marker.setLatLng([this.form.lat, this.form.lng]);
    } else if (this.map) {
      this.marker = L.marker([this.form.lat, this.form.lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.form.lat = Math.round(pos.lat * 6) / 6;
        this.form.lng = Math.round(pos.lng * 6) / 6;
      });
    }

    this.map?.setView([this.form.lat, this.form.lng], 16);
  }

  updateMarkerFromCoords() {
    if (this.form.lat && this.form.lng) {
      this.setPosition(this.form.lat, this.form.lng);
    }
  }

  submit() {
    this.error = '';
    this.saving = true;

    this.plantingService.create({
      zone_id: this.form.zone_id,
      species_id: this.form.species_id,
      location: { lat: this.form.lat, lng: this.form.lng },
      planted_at: this.form.planted_at || undefined,
      initial_ph: this.form.initial_ph ?? undefined,
      initial_humidity: this.form.initial_humidity ?? undefined,
      initial_soil_texture: this.form.initial_soil_texture || undefined,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.error || err.error?.details?.[0]?.message || 'Error al registrar plántula';
        this.saving = false;
      },
    });
  }
}
