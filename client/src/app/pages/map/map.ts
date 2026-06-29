import { ChangeDetectionStrategy, Component, inject, afterNextRender, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { extractErrorMessage } from '../../helpers/api-error';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../constants/map';
import '../../helpers/leaflet';
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
  styleUrls: ['./map.scss', '../../../../node_modules/leaflet/dist/leaflet.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MapPage {
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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.map?.remove();
    });

    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.species.set(res.data),
      error: () => {
        this.species.set([]);
        this.loadingSpecies.set(false);
      },
      complete: () => this.loadingSpecies.set(false),
    });
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.zones.set(res.data),
      error: () => {
        this.zones.set([]);
        this.loadingZones.set(false);
      },
      complete: () => this.loadingZones.set(false),
    });

    afterNextRender(() => {
      this.initMap();
      this.loadGeoJson();

      fromEvent(window, 'resize').pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.map?.invalidateSize();
      });
    });
  }

  private initMap() {
    this.map = L.map('map-container', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
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
        this.error.set(extractErrorMessage(err, 'Error al cargar los datos del mapa'));
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

      marker.bindPopup(this.buildPopupContent(p, color), { maxWidth: 300, className: 'map-popup-wrapper' });
      this.layerGroup?.addLayer(marker);
    }
  }

  private buildPopupContent(p: GeoJsonFeature['properties'], color: string): HTMLElement {
    const planted = p.planted_at
      ? new Date(p.planted_at + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
      : '-';
    const lastMon = p.last_monitoring_date
      ? new Date(p.last_monitoring_date + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Nunca';

    const wrapper = document.createElement('div');
    wrapper.className = 'map-popup';

    const header = document.createElement('div');
    header.className = 'map-popup-header';
    header.style.borderLeft = `4px solid ${color}`;

    const nameStrong = document.createElement('strong');
    nameStrong.textContent = p.species_name;
    header.appendChild(nameStrong);

    const statusSpan = document.createElement('span');
    statusSpan.className = 'map-popup-status';
    statusSpan.style.background = color;
    statusSpan.textContent = STATUS_LABELS[p.survival_status];
    header.appendChild(statusSpan);

    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'map-popup-body';

    body.appendChild(this.popupRow('Nombre científico', p.scientific_name, true));
    body.appendChild(this.popupRow('Zona', p.zone_name));
    body.appendChild(this.popupRow('Plantado', planted));
    body.appendChild(this.popupRow('Últ. monitoreo', lastMon));

    if (p.photo_url) {
      const img = document.createElement('img');
      img.src = p.photo_url;
      img.alt = 'Foto';
      img.className = 'map-popup-photo';
      body.appendChild(img);
    }

    wrapper.appendChild(body);
    return wrapper;
  }

  private popupRow(label: string, value: string, italic = false): HTMLElement {
    const row = document.createElement('div');
    row.className = 'map-popup-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'map-popup-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'map-popup-value';
    const valueEl = italic ? document.createElement('em') : document.createElement('span');
    valueEl.textContent = value;
    valueSpan.appendChild(valueEl);
    row.appendChild(valueSpan);

    return row;
  }
}
