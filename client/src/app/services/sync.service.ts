import { Injectable, inject, effect, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OfflineService, type PendingPlanting } from './offline.service';
import { ConnectivityService } from './connectivity.service';
import { PlantingService } from './planting.service';
import type { CreatePlantingRequest } from '../models';

const MAX_RETRIES = 5;
const BACKOFF_BASE_MS = 2000;

@Injectable({ providedIn: 'root' })
export class SyncService {
  private offline = inject(OfflineService);
  private connectivity = inject(ConnectivityService);
  private plantingService = inject(PlantingService);

  syncing = false;
  readonly progress = signal<{ current: number; total: number } | null>(null);
  readonly errorItems = signal<string[]>([]);

  constructor() {
    effect(() => {
      if (this.connectivity.online() && !this.syncing) {
        const count = this.offline.pendingCount();
        if (count > 0) {
          this.sync();
        }
      }
    });
  }

  async sync() {
    if (this.syncing) return;
    this.syncing = true;
    this.errorItems.set([]);

    try {
      const pending = await this.offline.getPendingPlantings();
      if (pending.length === 0) return;

      this.progress.set({ current: 0, total: pending.length });

      const batch = pending.filter(p => p.retries < MAX_RETRIES);
      const payloads = batch.map(p => p.payload);

      if (payloads.length > 0) {
        await this.processBatch(batch, payloads);
      }

      this.progress.set(null);
    } finally {
      this.syncing = false;
    }
  }

  private async processBatch(batch: PendingPlanting[], payloads: CreatePlantingRequest[]) {
    try {
      const res = await firstValueFrom(this.plantingService.syncBatch(payloads));
      const results = res.data;

      for (const item of results) {
        const pending = batch[item.index];
        if (!pending || !pending.id) continue;

        if (item.status === 'success') {
          if (item.conflict === 'resolved') {
            this.errorItems.update(list => [...list, `Registro #${pending.id}: datos actualizados (conflicto resuelto)`]);
          }
          await this.uploadPhotoIfNeeded(pending, item.data?.id);
          await this.offline.removePlanting(pending.id);
        } else {
          await this.offline.incrementRetry(pending.id);
          const updated = await this.offline.getPendingPlantings();
          const current = updated.find(p => p.id === pending.id);
          if (current && current.retries >= MAX_RETRIES) {
            await this.offline.removePlanting(pending.id);
            this.errorItems.update(list => [...list, `Registro #${pending.id} descartado tras ${MAX_RETRIES} intentos`]);
          }
        }

        this.progress.update(p => p ? { ...p, current: p.current + 1 } : null);
      }
    } catch {
      await this.handleBatchError(batch);
    }
  }

  private async handleBatchError(batch: PendingPlanting[]) {
    for (const pending of batch) {
      if (!pending.id) continue;
      await this.offline.incrementRetry(pending.id);
      const updated = await this.offline.getPendingPlantings();
      const current = updated.find(p => p.id === pending.id);
      if (current && current.retries >= MAX_RETRIES) {
        await this.offline.removePlanting(pending.id);
        this.errorItems.update(list => [...list, `Registro #${pending.id} descartado por error de red`]);
      }
      this.progress.update(p => p ? { ...p, current: p.current + 1 } : null);
    }
  }

  private async uploadPhotoIfNeeded(pending: PendingPlanting, plantingId: number | undefined) {
    if (!pending.photo || !plantingId) return;
    try {
      const photoFile = new File([pending.photo.data], pending.photo.name, { type: pending.photo.data.type });
      await firstValueFrom(this.plantingService.uploadPhoto(plantingId, photoFile));
    } catch {
      this.errorItems.update(list => [...list, `No se pudo subir la foto de la plantación #${plantingId}`]);
    }
  }
}
