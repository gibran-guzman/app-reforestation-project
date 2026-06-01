import { Injectable, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OfflineService } from './offline.service';
import { ConnectivityService } from './connectivity.service';
import { PlantingService } from './planting.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private offline = inject(OfflineService);
  private connectivity = inject(ConnectivityService);
  private plantingService = inject(PlantingService);
  syncing = false;

  constructor() {
    effect(() => {
      if (this.connectivity.online()) {
        this.sync();
      }
    });
  }

  async sync() {
    if (this.syncing) return;
    this.syncing = true;

    try {
      const pending = await this.offline.getPendingPlantings();
      for (const item of pending) {
        try {
          const res = await firstValueFrom(this.plantingService.create(item.payload));
          if (item.photo && res?.data?.id) {
            const photoFile = new File([item.photo.data], item.photo.name, { type: item.photo.data.type });
            await firstValueFrom(this.plantingService.uploadPhoto(res.data.id, photoFile));
          }
          await this.offline.removePlanting(item.id!);
        } catch {
          await this.offline.incrementRetry(item.id!);
          if (item.retries >= 5) {
            await this.offline.removePlanting(item.id!);
          }
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}
