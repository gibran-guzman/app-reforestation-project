import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import { ReportsService } from '../../services/reports.service';
import type { PendingPlanting } from '../../services/offline.service';
import type { SurvivalRate, SpeciesStat, ZoneSummary } from '../../models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
})
export default class Dashboard implements OnInit {
  protected auth = inject(AuthService);
  protected connectivity = inject(ConnectivityService);
  protected offline = inject(OfflineService);
  protected syncService = inject(SyncService);
  private router = inject(Router);
  private reportsService = inject(ReportsService);

  successMsg = '';
  pendingList: PendingPlanting[] = [];
  syncError = '';

  overall = signal<SurvivalRate | null>(null);
  speciesStats = signal<SpeciesStat[]>([]);
  zoneSummary = signal<ZoneSummary[]>([]);
  loadingStats = signal(true);
  statsError = signal('');

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.successMsg = (nav?.extras?.state as Record<string, string>)?.['success'] || '';
    this.pendingList = await this.offline.getPendingPlantings();
    this.loadStats();
  }

  private loadStats() {
    this.reportsService.getSurvivalRate().subscribe({
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
}
