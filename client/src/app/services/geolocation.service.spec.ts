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
  });
});
