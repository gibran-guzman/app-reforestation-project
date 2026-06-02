import { Component, inject, OnInit, OnDestroy, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import type { Species, Zone, GeoJsonFeature, GeoJsonFeatureCollection } from '../../models';
import L from 'leaflet';

const STATUS_COLORS: Record<string, string> = {
  alive: '#2d6a4f',
  struggling: '#e9c46a',
  dead: '#d62828',
  unmonitored: '#adb5bd',
};

const STATUS_LABELS: Record<string, string> = {
  alive: 'Viva',
  struggling: 'Estresada',
  dead: 'Muerta',
  unmonitored: 'Sin monitoreo',
};

@Component({
  selector: 'app-map',
  imports: [FormsModule],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export default class MapPage implements OnInit, OnDestroy {
  private plantingService = inject(PlantingService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private destroyRef = inject(DestroyRef);

  species = signal<Species[]>([]);
  zones = signal<Zone[]>([]);
  features = signal<GeoJsonFeature[]>([]);
  loading = signal(false);
  loadingSpecies = signal(true);
  loadingZones = signal(true);
  error = signal('');
  total = signal(0);

  filterSpecies = signal<number | ''>('');
  filterZone = signal<number | ''>('');
  filterFrom = signal('');
  filterTo = signal('');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  ngOnInit() {
    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.species.set(res.data),
      error: () => this.species.set([]),
      complete: () => this.loadingSpecies.set(false),
    });
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.zones.set(res.data),
      error: () => this.zones.set([]),
      complete: () => this.loadingZones.set(false),
    });
    this.initMap();
    this.loadGeoJson();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private initMap() {
    this.map = L.map('map-container', {
      center: [-0.229, -78.524],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private buildFilters() {
    const f: Record<string, string | number> = {};
    if (this.filterSpecies()) f['species_id'] = Number(this.filterSpecies());
    if (this.filterZone()) f['zone_id'] = Number(this.filterZone());
    if (this.filterFrom()) f['from'] = this.filterFrom();
    if (this.filterTo()) f['to'] = this.filterTo();
    return f;
  }

  loadGeoJson() {
    this.loading.set(true);
    this.error.set('');
    this.plantingService.getGeoJson(this.buildFilters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.features.set(res.features);
        this.total.set(res.features.length);
        this.loading.set(false);
        this.renderMarkers(res);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar los datos del mapa');
        this.loading.set(false);
      },
    });
  }

  private renderMarkers(data: GeoJsonFeatureCollection) {
    this.layerGroup?.clearLayers();

    for (const feature of data.features) {
      const coords = feature.geometry.coordinates;
      const p = feature.properties;
      const color = STATUS_COLORS[p.survival_status] || STATUS_COLORS['unmonitored'];

      const marker = L.circleMarker([coords[1], coords[0]], {
        radius: 9,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const planted = p.planted_at
        ? new Date(p.planted_at + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
      const lastMon = p.last_monitoring_date
        ? new Date(p.last_monitoring_date + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Nunca';

      const popupHtml = `
        <div class="map-popup">
          <div class="map-popup-header" style="border-left:4px solid ${color}">
            <strong>${p.species_name}</strong>
            <span class="map-popup-status" style="background:${color}">${STATUS_LABELS[p.survival_status]}</span>
          </div>
          <div class="map-popup-body">
            <div class="map-popup-row">
              <span class="map-popup-label">Nombre científico</span>
              <span class="map-popup-value"><em>${p.scientific_name}</em></span>
            </div>
            <div class="map-popup-row">
              <span class="map-popup-label">Zona</span>
              <span class="map-popup-value">${p.zone_name}</span>
            </div>
            <div class="map-popup-row">
              <span class="map-popup-label">Plantado</span>
              <span class="map-popup-value">${planted}</span>
            </div>
            <div class="map-popup-row">
              <span class="map-popup-label">Últ. monitoreo</span>
              <span class="map-popup-value">${lastMon}</span>
            </div>
            ${p.photo_url ? `<img src="${p.photo_url}" alt="Foto" class="map-popup-photo">` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300, className: 'map-popup-wrapper' });
      this.layerGroup?.addLayer(marker);
    }
  }
}
