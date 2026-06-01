import { Injectable, signal } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { CreatePlantingRequest } from '../models';

export interface PendingPlanting {
  id?: number;
  payload: CreatePlantingRequest;
  photo?: { name: string; data: Blob };
  created_at: Date;
  retries: number;
}

interface PendingPhoto {
  id?: number;
  planting_id: number;
  file_name: string;
  data: Blob;
  created_at: Date;
  retries: number;
}

class OfflineDB extends Dexie {
  pendingPlantings!: Table<PendingPlanting, number>;
  pendingPhotos!: Table<PendingPhoto, number>;

  constructor() {
    super('LloaReforestationDB');
    this.version(1).stores({
      pendingPlantings: '++id, created_at, retries',
      pendingPhotos: '++id, planting_id, created_at, retries',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private db = new OfflineDB();
  readonly pendingCount = signal(0);

  constructor() {
    this.refreshCount();
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((e) => {
        if (e.usage && e.quota && (e.usage / e.quota) > 0.8) {
          console.warn('Almacenamiento local casi lleno:', Math.round(e.usage / e.quota * 100) + '%');
        }
      });
    }
  }

  private async refreshCount() {
    const count = await this.db.pendingPlantings.count();
    this.pendingCount.set(count);
  }

  async savePlanting(data: CreatePlantingRequest, photoFile?: File): Promise<void> {
    let photo: { name: string; data: Blob } | undefined;
    if (photoFile) {
      photo = { name: photoFile.name, data: photoFile };
    }
    await this.db.pendingPlantings.add({
      payload: data,
      photo,
      created_at: new Date(),
      retries: 0,
    });
    await this.refreshCount();
  }

  async getPendingPlantings(): Promise<PendingPlanting[]> {
    return this.db.pendingPlantings.orderBy('created_at').toArray();
  }

  async removePlanting(id: number): Promise<void> {
    await this.db.pendingPlantings.delete(id);
    await this.refreshCount();
  }

  async incrementRetry(id: number): Promise<void> {
    const item = await this.db.pendingPlantings.get(id);
    if (item) {
      await this.db.pendingPlantings.update(id, { retries: item.retries + 1 });
    }
  }

  async getPendingPhotos(): Promise<PendingPhoto[]> {
    return this.db.pendingPhotos.orderBy('created_at').toArray();
  }

  async clearAll(): Promise<void> {
    await this.db.pendingPlantings.clear();
    await this.db.pendingPhotos.clear();
    this.pendingCount.set(0);
  }
}
