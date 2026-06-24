import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpTesting: HttpTestingController;

  const mockHeatmapResponse = {
    periods: [
      { label: '2024-01', data: [{ lat: -0.2, lng: -78.5, weight: 3 }] },
    ],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHeatmap', () => {
    it('calls endpoint without filters', () => {
      service.getHeatmap().subscribe(res => {
        expect(res.total).toBe(1);
      });

      const req = httpTesting.expectOne('/api/analytics/heatmap');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockHeatmapResponse);
    });

    it('sends zone_id filter', () => {
      service.getHeatmap({ zone_id: 5 }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/analytics/heatmap');
      expect(req.request.params.get('zone_id')).toBe('5');
      expect(req.request.params.has('species_id')).toBeFalse();
      req.flush(mockHeatmapResponse);
    });

    it('sends all filters', () => {
      service.getHeatmap({ zone_id: 1, species_id: 2, from: '2024-01', to: '2024-12', interval: 'month' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/analytics/heatmap');
      expect(req.request.params.get('zone_id')).toBe('1');
      expect(req.request.params.get('species_id')).toBe('2');
      expect(req.request.params.get('from')).toBe('2024-01');
      expect(req.request.params.get('to')).toBe('2024-12');
      expect(req.request.params.get('interval')).toBe('month');
      req.flush(mockHeatmapResponse);
    });

    it('sends partial filters', () => {
      service.getHeatmap({ from: '2024-01' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/analytics/heatmap');
      expect(req.request.params.get('from')).toBe('2024-01');
      expect(req.request.params.has('zone_id')).toBeFalse();
      expect(req.request.params.has('species_id')).toBeFalse();
      expect(req.request.params.has('to')).toBeFalse();
      expect(req.request.params.has('interval')).toBeFalse();
      req.flush(mockHeatmapResponse);
    });

    it('handles error response', () => {
      let error: any;
      service.getHeatmap().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/analytics/heatmap');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

      expect(error.status).toBe(500);
    });

    it('sends undefined filters gracefully', () => {
      service.getHeatmap(undefined).subscribe();

      const req = httpTesting.expectOne('/api/analytics/heatmap');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockHeatmapResponse);
    });
  });
});
