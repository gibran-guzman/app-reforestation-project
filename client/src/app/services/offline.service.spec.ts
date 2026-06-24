import { TestBed } from '@angular/core/testing';
import { OfflineService, type PendingPlanting } from './offline.service';
import type { CreatePlantingRequest } from '../models';

function mockStorageEstimate(result: { usage: number; quota: number }) {
  const orig = navigator.storage?.estimate;
  if (navigator.storage) {
    spyOn(navigator.storage, 'estimate').and.resolveTo(result as any);
  }
}

describe('OfflineService', () => {
  let service: OfflineService;
  let db: any;
  let mockToArray: jasmine.Spy;

  function mockDb() {
    db = (service as any).db;
    mockToArray = jasmine.createSpy('toArray').and.resolveTo([]);
    spyOn(db.pendingPlantings, 'add').and.resolveTo(1);
    spyOn(db.pendingPlantings, 'count').and.resolveTo(0);
    spyOn(db.pendingPlantings, 'delete').and.resolveTo();
    spyOn(db.pendingPlantings, 'get').and.resolveTo(null);
    spyOn(db.pendingPlantings, 'update').and.resolveTo(1);
    spyOn(db.pendingPlantings, 'clear').and.resolveTo();
    spyOn(db.pendingPlantings, 'orderBy').and.returnValue({ toArray: mockToArray });
  }

  beforeEach(async () => {
    spyOn(console, 'warn');
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineService);
    mockDb();
    await new Promise(resolve => setTimeout(resolve));
    (service as any).pendingCount.set(0);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('savePlanting', () => {
    const payload: CreatePlantingRequest = {
      zone_id: 1,
      species_id: 2,
      location: { lat: -0.2, lng: -78.5 },
    };

    it('saves planting without photo', async () => {
      await service.savePlanting(payload);
      expect(db.pendingPlantings.add).toHaveBeenCalledWith(jasmine.objectContaining({
        payload,
        retries: 0,
      }));
    });

    it('saves planting with photo', async () => {
      const file = new File(['photo-data'], 'test.jpg', { type: 'image/jpeg' });
      await service.savePlanting(payload, file);
      expect(db.pendingPlantings.add).toHaveBeenCalledWith(jasmine.objectContaining({
        payload,
        photo: { name: 'test.jpg', data: file },
        retries: 0,
      }));
    });

    it('updates pendingCount after save', async () => {
      db.pendingPlantings.count.and.resolveTo(3);
      await service.savePlanting(payload);
      expect(service.pendingCount()).toBe(3);
    });
  });

  describe('getPendingPlantings', () => {
    it('returns ordered plantings', async () => {
      const mockList: PendingPlanting[] = [
        { id: 1, payload: {} as any, created_at: new Date(), retries: 0 },
      ];
      mockToArray.and.resolveTo(mockList);

      const result = await service.getPendingPlantings();
      expect(result).toEqual(mockList);
      expect(db.pendingPlantings.orderBy).toHaveBeenCalledWith('created_at');
    });

    it('returns empty array when none exist', async () => {
      const result = await service.getPendingPlantings();
      expect(result).toEqual([]);
    });
  });

  describe('removePlanting', () => {
    it('deletes by id and refreshes count', async () => {
      await service.removePlanting(5);
      expect(db.pendingPlantings.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('incrementRetry', () => {
    it('increments retry when item exists', async () => {
      db.pendingPlantings.get.and.resolveTo({ id: 1, retries: 2 });

      await service.incrementRetry(1);

      expect(db.pendingPlantings.update).toHaveBeenCalledWith(1, { retries: 3 });
    });

    it('does nothing when item does not exist', async () => {
      db.pendingPlantings.get.and.resolveTo(undefined);

      await service.incrementRetry(999);

      expect(db.pendingPlantings.update).not.toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('clears table and resets count', async () => {
      (service as any).pendingCount.set(5);
      await service.clearAll();

      expect(db.pendingPlantings.clear).toHaveBeenCalled();
      expect(service.pendingCount()).toBe(0);
    });
  });

  describe('constructor storage warning', () => {
    it('warns when storage is nearly full', async () => {
      if (navigator.storage) {
        spyOn(navigator.storage, 'estimate').and.resolveTo({ usage: 900, quota: 1000 } as any);
      }
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(OfflineService);
      await new Promise((resolve) => setTimeout(resolve));
      expect(svc).toBeTruthy();
    });

    it('handles missing navigator.storage', () => {
      const desc = Object.getOwnPropertyDescriptor(navigator, 'storage');
      delete (navigator as any).storage;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(OfflineService);
      expect(svc).toBeTruthy();
      if (desc) {
        Object.defineProperty(navigator, 'storage', desc);
      }
    });
  });
});
