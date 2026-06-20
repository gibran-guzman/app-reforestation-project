import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('online signal', () => {
    it('starts with navigator.onLine value', () => {
      expect(service.online()).toBe(navigator.onLine);
    });

    it('sets true on online event', () => {
      window.dispatchEvent(new Event('online'));
      expect(service.online()).toBeTrue();
    });

    it('sets false on offline event', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.online()).toBeFalse();
    });

    it('toggles between online and offline', () => {
      window.dispatchEvent(new Event('online'));
      expect(service.online()).toBeTrue();

      window.dispatchEvent(new Event('offline'));
      expect(service.online()).toBeFalse();

      window.dispatchEvent(new Event('online'));
      expect(service.online()).toBeTrue();
    });
  });
});
