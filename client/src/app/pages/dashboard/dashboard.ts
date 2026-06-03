import { Component, inject, OnInit, signal, ElementRef, viewChild, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { PlantingService } from '../../services/planting.service';
import type { PendingPlanting } from '../../services/offline.service';
import type { SurvivalRate, SpeciesStat, ZoneSummary, EvolutionPoint, PlantingSite } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export default class Dashboard implements OnInit {
  protected auth = inject(AuthService);
  protected connectivity = inject(ConnectivityService);
  protected offline = inject(OfflineService);
  protected syncService = inject(SyncService);
  protected router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private reportsService = inject(ReportsService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);
  private plantingService = inject(PlantingService);

  successMsg = '';
  pendingList: PendingPlanting[] = [];
  syncError = '';

  overall = signal<SurvivalRate | null>(null);
  speciesStats = signal<SpeciesStat[]>([]);
  zoneSummary = signal<ZoneSummary[]>([]);
  evolution = signal<EvolutionPoint[]>([]);
  recentPlantings = signal<PlantingSite[]>([]);
  speciesCount = signal(0);
  zoneCount = signal(0);
  loadingStats = signal(true);
  statsError = signal('');

  evolutionChartRef = viewChild<ElementRef<HTMLCanvasElement>>('evolutionChart');
  private evolutionChart: Chart | null = null;

  constructor() {
    effect(() => {
      if (this.evolutionChartRef() && this.evolution().length > 0) {
        this.renderEvolutionChart();
      }
    });
  }

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.successMsg = (nav?.extras?.state as Record<string, string>)?.['success'] || '';
    this.pendingList = await this.offline.getPendingPlantings();
    this.loadStats();
    this.loadAuxData();
  }

  private loadStats() {
    this.reportsService.getSurvivalRate().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.overall.set(res.data.overall);
        this.speciesStats.set(res.data.bySpecies);
        this.zoneSummary.set(res.data.byZone);
        this.loadingStats.set(false);
      },
      error: () => {
        this.statsError.set('No se pudieron cargar las estadísticas');
        this.loadingStats.set(false);
      },
    });
  }

  private loadAuxData() {
    this.reportsService.getEvolution().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.evolution.set(res.data),
    });

    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.speciesCount.set(res.data.length),
    });

    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.zoneCount.set(res.data.length),
    });

    this.plantingService.list(1, 5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.recentPlantings.set(res.data),
    });
  }

  async doSync() {
    this.syncError = '';
    try {
      await this.syncService.sync();
      this.pendingList = await this.offline.getPendingPlantings();
    } catch {
      this.syncError = 'Error al sincronizar. Intenta de nuevo.';
    }
  }

  async refreshPending() {
    this.pendingList = await this.offline.getPendingPlantings();
  }

  rate(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  survivalColor(value: number, total: number): string {
    const pct = this.rate(value, total);
    if (pct >= 70) return 'bg-success';
    if (pct >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { alive: 'Vivas', struggling: 'Estresadas', dead: 'Muertas' };
    return map[status] || status;
  }

  trendClass(current: number, previous: number): string {
    if (previous === 0) return 'text-muted';
    if (current > previous) return 'text-success';
    if (current < previous) return 'text-danger';
    return 'text-muted';
  }

  trendIcon(current: number, previous: number): string {
    if (previous === 0) return '–';
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '→';
  }

  private renderEvolutionChart() {
    const canvas = this.evolutionChartRef();
    if (!canvas) return;

    this.evolutionChart?.destroy();

    const data = this.evolution();
    const labels = data.map((e) => {
      const [y, m] = e.period.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[parseInt(m, 10) - 1]} ${y}`;
    });
    const values = data.map((e) => e.total);

    this.evolutionChart = new Chart(canvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Plantaciones',
          data: values,
          borderColor: '#2d6a4f',
          backgroundColor: 'rgba(45, 106, 79, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#2d6a4f',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} plantación(es)`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  }
}
