import { Component, inject, OnInit, OnDestroy, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, type HeatmapResponse, type HeatmapPoint } from '../../services/analytics.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import type { Species, Zone } from '../../models';
import L from 'leaflet';
import 'leaflet.heat';

@Component({
  selector: 'app-heatmap',
  imports: [FormsModule],
  templateUrl: './heatmap.html',
  styleUrl: './heatmap.scss',
})
export default class HeatmapPage implements OnInit, OnDestroy {
  private analyticsService = inject(AnalyticsService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private destroyRef = inject(DestroyRef);

  species = signal<Species[]>([]);
  zones = signal<Zone[]>([]);
  loading = signal(false);
  error = signal('');
  data = signal<HeatmapResponse | null>(null);
  currentPeriod = signal(0);
  playing = signal(false);
  interval = signal<'month' | 'quarter' | 'year'>('month');
  total = signal(0);

  filterSpecies = signal<number | ''>('');
  filterZone = signal<number | ''>('');

  private map: L.Map | null = null;
  private heatLayer: L.HeatLayer | null = null;
  private animationTimer: ReturnType<typeof setInterval> | null = null;

  get periods() {
    return this.data()?.periods ?? [];
  }

  get currentLabel() {
    const p = this.periods;
    return p.length > 0 ? p[this.currentPeriod()]?.label ?? '' : '';
  }

  get currentPoints() {
    const p = this.periods;
    return p.length > 0 ? p[this.currentPeriod()]?.data ?? [] : [];
  }

  get maxIndex() {
    return Math.max(0, this.periods.length - 1);
  }

  ngOnInit() {
    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.species.set(res.data),
      error: () => this.species.set([]),
    });
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.zones.set(res.data),
      error: () => this.zones.set([]),
    });
    this.initMap();
    this.loadData();
  }

  ngOnDestroy() {
    this.stopAnimation();
    this.map?.remove();
  }

  private initMap() {
    this.map = L.map('heatmap-container', {
      center: [-0.229, -78.524],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.heatLayer = L.heatLayer([], {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      max: 1,
      gradient: { 0.0: '#2d6a4f', 0.3: '#e9c46a', 0.6: '#e76f51', 0.8: '#d62828', 1.0: '#6a040f' },
    }).addTo(this.map);

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private buildFilters() {
    const f: Record<string, string | number> = {};
    if (this.filterSpecies()) f['species_id'] = Number(this.filterSpecies());
    if (this.filterZone()) f['zone_id'] = Number(this.filterZone());
    f['interval'] = this.interval();
    return f;
  }

  loadData() {
    this.stopAnimation();
    this.loading.set(true);
    this.error.set('');
    this.currentPeriod.set(0);

    this.analyticsService.getHeatmap(this.buildFilters()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.data.set(res);
        this.total.set(res.total);
        this.loading.set(false);
        this.renderPeriod(0);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar datos del mapa de calor');
        this.loading.set(false);
      },
    });
  }

  private renderPeriod(index: number) {
    const points = this.periods[index]?.data ?? [];
    this.currentPeriod.set(index);
    const latlngs: Array<[number, number, number]> = points.map((p) => [p.lat, p.lng, p.weight]);
    this.heatLayer?.setLatLngs(latlngs);
  }

  goToPeriod(index: number) {
    if (index < 0 || index >= this.periods.length) return;
    this.renderPeriod(index);
  }

  togglePlay() {
    if (this.playing()) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  private startAnimation() {
    if (this.periods.length <= 1) return;
    this.playing.set(true);
    this.animationTimer = setInterval(() => {
      const next = (this.currentPeriod() + 1) % this.periods.length;
      this.renderPeriod(next);
      if (next === 0) {
        this.stopAnimation();
      }
    }, 1200);
  }

  private stopAnimation() {
    this.playing.set(false);
    if (this.animationTimer !== null) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  onIntervalChange() {
    this.loadData();
  }
}
