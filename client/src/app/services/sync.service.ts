import { Injectable, inject, effect, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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

  readonly syncing = signal(false);
  readonly progress = signal<{ current: number; total: number } | null>(null);
  readonly errorItems = signal<string[]>([]);

  constructor() {
    effect(() => {
      if (this.connectivity.online() && !this.syncing()) {
        const count = this.offline.pendingCount();
        if (count > 0) {
          this.sync();
        }
      }
    });
  }

  async sync() {
    if (this.syncing()) return;
    this.syncing.set(true);
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
      this.syncing.set(false);
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
          const photoUploaded = await this.uploadPhotoIfNeeded(pending, item.data?.id);
          if (photoUploaded) {
            await this.offline.removePlanting(pending.id);
          }
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
    } catch (err: unknown) {
      if (this.isPermanentError(err)) {
        for (const p of batch) {
          if (!p.id) continue;
          await this.offline.removePlanting(p.id);
          this.errorItems.update(list => [...list, `Registro #${p.id}: error permanente, descartado`]);
        }
      } else {
        await this.applyTransientBackoff(batch);
      }
    }
  }

  private isPermanentError(err: unknown): boolean {
    if (err instanceof HttpErrorResponse) {
      return err.status >= 400 && err.status !== 429 && err.status < 500;
    }
    if (err instanceof SyntaxError) return true;
    return false;
  }

  private async applyTransientBackoff(batch: PendingPlanting[]) {
    for (const pending of batch) {
      if (!pending.id) continue;
      await this.offline.incrementRetry(pending.id);
      const updated = await this.offline.getPendingPlantings();
      const current = updated.find(p => p.id === pending.id);
      if (current && current.retries >= MAX_RETRIES) {
        await this.offline.removePlanting(pending.id);
        this.errorItems.update(list => [...list, `Registro #${pending.id} descartado tras ${MAX_RETRIES} intentos`]);
      } else if (current) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, current.retries - 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 60000)));
      }
      this.progress.update(p => p ? { ...p, current: p.current + 1 } : null);
    }
  }

  private async uploadPhotoIfNeeded(pending: PendingPlanting, plantingId: number | undefined): Promise<boolean> {
    if (!pending.photo || !plantingId) return true;
    try {
      const photoFile = new File([pending.photo.data], pending.photo.name, { type: pending.photo.data.type });
      await firstValueFrom(this.plantingService.uploadPhoto(plantingId, photoFile));
      return true;
    } catch (err: unknown) {
      this.errorItems.update(list => [...list, `No se pudo subir la foto de la plantación #${plantingId}`]);
      return false;
    }
  }
}
