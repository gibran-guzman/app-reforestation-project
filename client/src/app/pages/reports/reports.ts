import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ElementRef, viewChild, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { extractErrorMessage } from '../../helpers/api-error';
import { survivalRate, survivalColorClass } from '../../helpers/survival';
import { buildFilterParams, type Filters } from '../../helpers/filters';
import type { SurvivalReport, SpeciesStat, ZoneSummary, Species, Zone } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  imports: [DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Reports implements OnInit {
  private reportsService = inject(ReportsService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private destroyRef = inject(DestroyRef);

  readonly report = signal<SurvivalReport | null>(null);
  readonly speciesStats = signal<SpeciesStat[]>([]);
  readonly zoneSummary = signal<ZoneSummary[]>([]);
  readonly species = signal<Species[]>([]);
  readonly zones = signal<Zone[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterSpecies = signal<number | ''>('');
  readonly filterZone = signal<number | ''>('');
  readonly downloading = signal(false);

  readonly survivalChartRef = viewChild<ElementRef<HTMLCanvasElement>>('survivalChart');
  readonly speciesChartRef = viewChild<ElementRef<HTMLCanvasElement>>('speciesChart');
  private survivalChart: Chart | null = null;
  private speciesChart: Chart | null = null;

  protected survivalRate = survivalRate;
  protected survivalColorClass = survivalColorClass;

  constructor() {
    effect(() => {
      const report = this.report();
      const sStats = this.speciesStats();
      const survivalRef = untracked(this.survivalChartRef);
      const speciesRef = untracked(this.speciesChartRef);
      if (report && survivalRef) {
        this.renderSurvivalChart(report, survivalRef.nativeElement);
      }
      if (sStats.length && speciesRef) {
        this.renderSpeciesChart(sStats, speciesRef.nativeElement);
      }
    });
  }

  ngOnInit() {
    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => this.species.set(res.data));
    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => this.zones.set(res.data));
    this.loadData();
  }

  private apiFilters(): Filters {
    const f: Filters = {};
    const speciesId = this.filterSpecies();
    const zoneId = this.filterZone();
    if (speciesId) f.species_id = Number(speciesId);
    if (zoneId) f.zone_id = Number(zoneId);
    return f;
  }

  loadData() {
    this.loading.set(true);
    this.error.set('');

    const filters = this.apiFilters();
    let hasError = false;

    forkJoin({
      report: this.reportsService.getSurvivalRate(filters).pipe(
        catchError((err) => {
          hasError = true;
          this.error.set(extractErrorMessage(err, 'Error al cargar reportes'));
          return of(null);
        }),
      ),
      species: this.reportsService.getSpeciesStats(filters).pipe(
        catchError((err) => {
          if (!hasError) {
            hasError = true;
            this.error.set(extractErrorMessage(err, 'Error al cargar estadísticas por especie'));
          }
          return of(null);
        }),
      ),
      zones: this.reportsService.getZoneSummary(filters).pipe(
        catchError((err) => {
          if (!hasError) {
            hasError = true;
            this.error.set(extractErrorMessage(err, 'Error al cargar resumen por zona'));
          }
          return of(null);
        }),
      ),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (results) => {
        if (results.report?.data) this.report.set(results.report.data);
        if (results.species?.data) this.speciesStats.set(results.species.data);
        if (results.zones?.data) this.zoneSummary.set(results.zones.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  downloadPdf() {
    this.downloading.set(true);
    const filters = this.apiFilters();

    this.reportsService.exportPdf(filters).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-plantaciones-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al generar el PDF'));
        this.downloading.set(false);
      },
    });
  }

  private renderSurvivalChart(r: SurvivalReport, canvas: HTMLCanvasElement) {
    this.survivalChart?.destroy();

    this.survivalChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Vivas', 'Estresadas', 'Muertas', 'Sin monitoreo'],
        datasets: [{
          data: [r.overall.alive, r.overall.struggling, r.overall.dead, r.overall.unmonitored],
          backgroundColor: ['#2d6a4f', '#e9c46a', '#d62828', '#adb5bd'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  private renderSpeciesChart(stats: SpeciesStat[], canvas: HTMLCanvasElement) {
    this.speciesChart?.destroy();

    const labels = stats.map((s) => s.common_name);
    const alive = stats.map((s) => s.alive);
    const struggling = stats.map((s) => s.struggling);
    const dead = stats.map((s) => s.dead);

    this.speciesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Vivas', data: alive, backgroundColor: '#2d6a4f' },
          { label: 'Estresadas', data: struggling, backgroundColor: '#e9c46a' },
          { label: 'Muertas', data: dead, backgroundColor: '#d62828' },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  rate(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  progressClass(value: number, total: number): string {
    const pct = this.rate(value, total);
    if (pct >= 70) return 'bg-success';
    if (pct >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { alive: 'Vivas', struggling: 'Estresadas', dead: 'Muertas' };
    return map[status] || status;
  }
}
