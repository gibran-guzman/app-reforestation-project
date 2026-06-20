import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeolocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAvailable', () => {
    it('returns true when geolocation is available', () => {
      expect(service.isAvailable()).toBeTrue();
    });
  });

  describe('getCurrentPosition', () => {
    it('rejects when geolocation is not available', async () => {
      const orig = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      try {
        await expectAsync(service.getCurrentPosition()).toBeRejected();
      } finally {
        Object.defineProperty(navigator, 'geolocation', {
          value: orig,
          configurable: true,
          writable: true,
        });
      }
    });

    it('resolves with rounded coordinates on success', async () => {
      const mockPos = {
        coords: { latitude: -0.229498, longitude: -78.524123 },
      } as GeolocationPosition;
      spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(
        (success: PositionCallback) => success(mockPos),
      );
      const coords = await service.getCurrentPosition();
      expect(coords).toEqual({ lat: -0.229498, lng: -78.524123 });
    });

    it('rejects on geolocation error callback', async () => {
      spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(
        (_: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 1, message: 'User denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError),
      );
      await expectAsync(service.getCurrentPosition()).toBeRejectedWithError(
        /No se pudo obtener la ubicación/,
      );
    });
  });
});
