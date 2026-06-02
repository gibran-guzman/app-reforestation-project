import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import type { PendingPlanting } from '../../services/offline.service';

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
  successMsg = '';
  pendingList: PendingPlanting[] = [];
  syncError = '';

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.successMsg = (nav?.extras?.state as Record<string, string>)?.['success'] || '';
    this.pendingList = await this.offline.getPendingPlantings();
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
}
