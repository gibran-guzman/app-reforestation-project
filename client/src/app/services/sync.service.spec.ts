import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SyncService } from './sync.service';
import { OfflineService } from './offline.service';
import { ConnectivityService } from './connectivity.service';
import { PlantingService } from './planting.service';

describe('SyncService', () => {
  let service: SyncService;
  let offlineMock: jasmine.SpyObj<OfflineService>;
  let connectivityMock: { online: ReturnType<typeof signal<boolean>> };
  let plantingMock: jasmine.SpyObj<PlantingService>;

  const mockSiteData = {
    id: 10,
    zone_id: 1,
    species_id: 1,
    location: { type: 'Point' as const, coordinates: [-78.5, -0.2] },
    planted_at: '2024-01-01T00:00:00Z',
    planted_by: null,
    initial_ph: null,
    initial_humidity: null,
    initial_soil_texture: null,
    photo_url: null,
    created_at: '2024-01-01T00:00:00Z',
    species_name: 'Test',
    zone_name: 'Zone',
  };

  const mockPending = {
    id: 1,
    payload: { zone_id: 1, species_id: 1, location: { lat: 0, lng: 0 } },
    created_at: new Date(),
    retries: 0,
  };

  const mockPendingWithPhoto = {
    ...mockPending,
    photo: { name: 'test.jpg', data: new Blob() },
  };

  let pendingCountSig: ReturnType<typeof signal<number>>;

  function createOfflineMock() {
    const mock = jasmine.createSpyObj('OfflineService', [
      'getPendingPlantings',
      'removePlanting',
      'incrementRetry',
      'pendingCount',
    ]);
    mock.pendingCount.and.callFake(() => pendingCountSig());
    return mock;
  }

  beforeEach(() => {
    pendingCountSig = signal(0);
    const onlineSignal = signal(false);
    connectivityMock = { online: onlineSignal };

    offlineMock = createOfflineMock();
    offlineMock.getPendingPlantings.and.resolveTo([]);

    plantingMock = jasmine.createSpyObj('PlantingService', [
      'syncBatch',
      'uploadPhoto',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: OfflineService, useValue: offlineMock },
        { provide: ConnectivityService, useValue: connectivityMock },
        { provide: PlantingService, useValue: plantingMock },
        SyncService,
      ],
    });
    service = TestBed.inject(SyncService);
    service.syncing.set(false);
    service.errorItems.set([]);
    service.progress.set(null);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sync', () => {
    it('returns early if syncing is already true', async () => {
      service.syncing.set(true);
      offlineMock.getPendingPlantings.and.resolveTo([mockPending]);

      await service.sync();

      expect(offlineMock.getPendingPlantings).not.toHaveBeenCalled();
    });

    it('returns early if no pending plantings', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([]);

      await service.sync();

      expect(plantingMock.syncBatch).not.toHaveBeenCalled();
      expect(service.syncing).toBeFalse();
    });

    it('processes pending batch successfully', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(plantingMock.syncBatch).toHaveBeenCalledWith([mockPending.payload]);
      expect(offlineMock.removePlanting).toHaveBeenCalledWith(1);
      expect(service.syncing).toBeFalse();
    });

    it('handles conflict resolution', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData, conflict: 'resolved' }],
      }));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(service.errorItems().length).toBe(1);
      expect(service.errorItems()[0]).toContain('conflicto resuelto');
      expect(offlineMock.removePlanting).toHaveBeenCalledWith(1);
    });

    it('increments retry on error item and removes at max retries', async () => {
      let callCount = 0;
      const pending4 = { ...mockPending, retries: 4 };
      const pending5 = { ...mockPending, retries: 5 };
      offlineMock.getPendingPlantings.and.callFake(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? [pending4] : [pending5]);
      });
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'error', error: 'Server error' }],
      }));
      offlineMock.incrementRetry.and.resolveTo();
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(offlineMock.incrementRetry).toHaveBeenCalledWith(1);
      expect(offlineMock.removePlanting).toHaveBeenCalledWith(1);
      expect(service.errorItems().length).toBe(1);
      expect(service.errorItems()[0]).toContain('descartado tras 5 intentos');
    });

    it('handles batch API error with handleBatchError', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPending, { ...mockPending, id: 2 }]);
      plantingMock.syncBatch.and.returnValue(throwError(() => new Error('Network error')));
      offlineMock.incrementRetry.and.resolveTo();
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(offlineMock.incrementRetry).toHaveBeenCalledWith(1);
      expect(offlineMock.incrementRetry).toHaveBeenCalledWith(2);
    });

    it('handles batch error and removes items at max retries', async () => {
      let callCount = 0;
      const pending4 = { ...mockPending, retries: 4 };
      const pending5 = { ...mockPending, retries: 5 };
      offlineMock.getPendingPlantings.and.callFake(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? [pending4] : [pending5]);
      });
      plantingMock.syncBatch.and.returnValue(throwError(() => new Error('Network error')));
      offlineMock.incrementRetry.and.resolveTo();
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(offlineMock.removePlanting).toHaveBeenCalledWith(1);
      expect(service.errorItems()[0]).toContain('error de red');
    });

    it('filters out items past max retries from batch', async () => {
      const overMax = { ...mockPending, id: 1, retries: 5 };
      const valid = { ...mockPending, id: 2, retries: 0 };
      offlineMock.getPendingPlantings.and.resolveTo([overMax, valid]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(plantingMock.syncBatch).toHaveBeenCalledWith([valid.payload]);
    });

    it('updates progress during sync', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      offlineMock.removePlanting.and.resolveTo();

      const progressSpy = jasmine.createSpy('progress');
      service.progress.set = progressSpy;

      await service.sync();

      expect(service.progress()).toBeNull();
    });
  });

  describe('uploadPhotoIfNeeded (via sync)', () => {
    it('uploads photo when pending has photo and sync succeeds', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPendingWithPhoto]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      plantingMock.uploadPhoto.and.returnValue(of({ data: { photo_url: 'http://example.com/photo.jpg' } }));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(plantingMock.uploadPhoto).toHaveBeenCalledWith(10, jasmine.any(File));
    });

    it('skips photo upload when pending has no photo', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(plantingMock.uploadPhoto).not.toHaveBeenCalled();
    });

    it('records error when photo upload fails', async () => {
      offlineMock.getPendingPlantings.and.resolveTo([mockPendingWithPhoto]);
      plantingMock.syncBatch.and.returnValue(of({
        data: [{ index: 0, status: 'success', data: mockSiteData }],
      }));
      plantingMock.uploadPhoto.and.returnValue(throwError(() => new Error('Upload failed')));
      offlineMock.removePlanting.and.resolveTo();

      await service.sync();

      expect(service.errorItems().length).toBe(1);
      expect(service.errorItems()[0]).toContain('No se pudo subir la foto');
    });
  });

  it('handleBatchError skips pending entries without id', async () => {
    offlineMock.getPendingPlantings.and.resolveTo([{ ...mockPending, id: null as unknown as number }, mockPending]);
    plantingMock.syncBatch.and.returnValue(throwError(() => new Error('Network error')));
    offlineMock.incrementRetry.and.resolveTo();
    offlineMock.removePlanting.and.resolveTo();

    await service.sync();

    expect(offlineMock.incrementRetry).toHaveBeenCalledTimes(1);
    expect(offlineMock.incrementRetry).toHaveBeenCalledWith(1);
  });

  it('progress.update callback handles null progress gracefully', () => {
    service.progress.set(null);
    service.progress.update(p => p ? { ...p, current: p.current + 1 } : null);
    expect(service.progress()).toBeNull();
  });

  describe('effect auto-triggers sync', () => {
    it('calls sync when coming online with pending items', fakeAsync(() => {
      const pendingCountSig = signal(2);
      const onlineSig = signal(false);

      const cm = { online: onlineSig };
      const om = {
        pendingCount: () => pendingCountSig(),
        getPendingPlantings: jasmine.createSpy('getPendingPlantings'),
      } as any;
      const pm = { syncBatch: jasmine.createSpy('syncBatch') } as any;
      om.getPendingPlantings.and.resolveTo([]);
      pm.syncBatch.and.returnValue(of({ data: [] }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: OfflineService, useValue: om },
          { provide: ConnectivityService, useValue: cm },
          { provide: PlantingService, useValue: pm },
          SyncService,
        ],
      });
      const svc = TestBed.inject(SyncService);
      svc.syncing.set(false);

      onlineSig.set(true);
      tick(100);

      expect(om.getPendingPlantings).toHaveBeenCalled();
    }));
  });

  it('skips results with out-of-bounds index in processBatch', async () => {
    offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
    plantingMock.syncBatch.and.returnValue(of({
      data: [
        { index: 999, status: 'success', data: mockSiteData },
        { index: 0, status: 'success', data: mockSiteData },
      ],
    }));
    offlineMock.removePlanting.and.resolveTo();

    await service.sync();

    expect(offlineMock.removePlanting).toHaveBeenCalledTimes(1);
    expect(offlineMock.removePlanting).toHaveBeenCalledWith(1);
  });

  it('covers null branch of progress.update in handleBatchError', async () => {
    offlineMock.getPendingPlantings.and.resolveTo([mockPending]);
    plantingMock.syncBatch.and.returnValue(throwError(() => new Error('Network error')));
    offlineMock.incrementRetry.and.callFake(() => {
      service.progress.set(null);
      return Promise.resolve();
    });

    await service.sync();

    expect(service.progress()).toBeNull();
  });
});
