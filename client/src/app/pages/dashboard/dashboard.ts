import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, ElementRef, viewChild, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { PlantingService } from '../../services/planting.service';
import { survivalRate, survivalColorClass, statusLabel } from '../../helpers/survival';
import { RECENT_PLANTINGS_LIMIT } from '../../constants/map';
import type { PendingPlanting } from '../../services/offline.service';
import type { SurvivalRate, SpeciesStat, ZoneSummary, EvolutionPoint, PlantingSite } from '../../models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly successMsg = signal('');
  readonly pendingList = signal<PendingPlanting[]>([]);
  readonly syncError = signal('');

  readonly overall = signal<SurvivalRate | null>(null);
  readonly speciesStats = signal<SpeciesStat[]>([]);
  readonly zoneSummary = signal<ZoneSummary[]>([]);
  readonly evolution = signal<EvolutionPoint[]>([]);
  readonly recentPlantings = signal<PlantingSite[]>([]);
  readonly speciesCount = signal(0);
  readonly zoneCount = signal(0);
  readonly loadingStats = signal(true);
  readonly statsError = signal('');

  protected survivalRate = survivalRate;
  protected survivalColorClass = survivalColorClass;
  protected statusLabel = statusLabel;

  readonly speciesRates = computed(() =>
    this.speciesStats().map(s => ({ id: s.id, rate: survivalRate(s.alive, s.monitored), color: survivalColorClass(s.alive, s.monitored) }))
  );
  readonly zoneRates = computed(() =>
    this.zoneSummary().map(z => ({ id: z.id, rate: survivalRate(z.alive, z.monitored), color: survivalColorClass(z.alive, z.monitored) }))
  );

  evolutionChartRef = viewChild<ElementRef<HTMLCanvasElement>>('evolutionChart');
  private evolutionChart: Chart | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.evolutionChart?.destroy());

    effect(() => {
      const data = this.evolution();
      const chartRef = untracked(this.evolutionChartRef);
      if (data.length > 0 && chartRef) {
        this.renderEvolutionChart(data, chartRef.nativeElement);
      }
    });
  }

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation() as { extras: { state: Record<string, string> } } | null;
    this.successMsg.set(nav?.extras?.state?.['success'] || '');
    this.pendingList.set(await this.offline.getPendingPlantings());
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
      error: () => console.warn('[Dashboard] No se pudo cargar la evolución de plantaciones'),
    });

    this.speciesService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.speciesCount.set(res.data.length),
    });

    this.zoneService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.zoneCount.set(res.data.length),
    });

    this.plantingService.list(1, RECENT_PLANTINGS_LIMIT).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.recentPlantings.set(res.data),
    });
  }

  async doSync() {
    this.syncError.set('');
    try {
      await this.syncService.sync();
      this.pendingList.set(await this.offline.getPendingPlantings());
    } catch (err) {
      this.syncError.set('Error al sincronizar. Intenta de nuevo.');
    }
  }

  async refreshPending() {
    this.pendingList.set(await this.offline.getPendingPlantings());
  }

  clearSuccess() {
    this.successMsg.set('');
  }

  trendClass(current: number, previous: number): string {
    if (previous === 0) return 'text-muted';
    if (current > previous) return 'text-success';
    if (current < previous) return 'text-danger';
    return 'text-muted';
  }

  trendIcon(current: number, previous: number): string {
    if (previous === 0) return '\u2013';
    if (current > previous) return '\u2191';
    if (current < previous) return '\u2193';
    return '\u2192';
  }

  private renderEvolutionChart(data: EvolutionPoint[], canvas: HTMLCanvasElement) {
    this.evolutionChart?.destroy();

    const labels = data.map((e) => {
      const [y, m] = e.period.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[parseInt(m, 10) - 1]} ${y}`;
    });
    const values = data.map((e) => e.total);

    this.evolutionChart = new Chart(canvas, {
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
