import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpTesting: HttpTestingController;

  const mockFilters = { zone_id: 1, species_id: 2, from: '2024-01', to: '2024-12' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSurvivalRate', () => {
    const mockResponse = {
      data: {
        overall: { total: 100, monitored: 80, alive: 60, struggling: 10, dead: 10, unmonitored: 20 },
        bySpecies: [],
        byZone: [],
      },
    };

    it('calls endpoint without filters', () => {
      service.getSurvivalRate().subscribe();

      const req = httpTesting.expectOne('/api/reports/survival-rate');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('sends all filters', () => {
      service.getSurvivalRate(mockFilters).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/reports/survival-rate');
      expect(req.request.params.get('zone_id')).toBe('1');
      expect(req.request.params.get('species_id')).toBe('2');
      expect(req.request.params.get('from')).toBe('2024-01');
      expect(req.request.params.get('to')).toBe('2024-12');
      req.flush(mockResponse);
    });

    it('handles error', () => {
      let error: any;
      service.getSurvivalRate().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/reports/survival-rate');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('getSpeciesStats', () => {
    const mock = { data: [{ id: 1, common_name: 'Polylepis', scientific_name: 'P. sp.', total_planted: 50, monitored: 40, alive: 35, struggling: 3, dead: 2 }] };

    it('calls endpoint without filters', () => {
      service.getSpeciesStats().subscribe(res => {
        expect(res.data.length).toBe(1);
      });

      const req = httpTesting.expectOne('/api/reports/species-stats');
      req.flush(mock);
    });

    it('sends filters', () => {
      service.getSpeciesStats({ zone_id: 3 }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/reports/species-stats');
      expect(req.request.params.get('zone_id')).toBe('3');
      req.flush(mock);
    });

    it('handles empty result', () => {
      service.getSpeciesStats().subscribe(res => {
        expect(res.data).toEqual([]);
      });

      const req = httpTesting.expectOne('/api/reports/species-stats');
      req.flush({ data: [] });
    });
  });

  describe('getZoneSummary', () => {
    const mock = { data: [{ id: 1, name: 'Zone A', total_plantings: 30, monitored: 25, alive: 20, struggling: 3, dead: 2 }] };

    it('calls endpoint without filters', () => {
      service.getZoneSummary().subscribe();

      const req = httpTesting.expectOne('/api/reports/zone-summary');
      req.flush(mock);
    });

    it('sends partial filters', () => {
      service.getZoneSummary({ species_id: 5 }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/reports/zone-summary');
      expect(req.request.params.get('species_id')).toBe('5');
      req.flush(mock);
    });
  });

  describe('getEvolution', () => {
    const mock = { data: [{ period: '2024-01', total: 10 }, { period: '2024-02', total: 15 }] };

    it('calls endpoint', () => {
      service.getEvolution().subscribe(res => {
        expect(res.data.length).toBe(2);
      });

      const req = httpTesting.expectOne('/api/reports/planting-evolution');
      req.flush(mock);
    });

    it('sends filters', () => {
      service.getEvolution(mockFilters).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/reports/planting-evolution');
      expect(req.request.params.get('zone_id')).toBe('1');
      req.flush(mock);
    });
  });

  describe('exportPdf', () => {
    it('downloads blob without filters', () => {
      const blob = new Blob(['pdf-data'], { type: 'application/pdf' });

      service.exportPdf().subscribe(res => {
        expect(res).toEqual(blob);
      });

      const req = httpTesting.expectOne('/api/reports/export/pdf');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });

    it('downloads blob with filters', () => {
      service.exportPdf(mockFilters).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/reports/export/pdf');
      expect(req.request.params.get('zone_id')).toBe('1');
      req.flush(new Blob());
    });

    it('handles export error', () => {
      let error: any;
      service.exportPdf().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/reports/export/pdf');
      req.error(new ProgressEvent('error'));
      expect(error).toBeDefined();
    });

    it('passes null/undefined filters gracefully', () => {
      service.exportPdf(undefined).subscribe();

      const req = httpTesting.expectOne('/api/reports/export/pdf');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(new Blob());
    });
  });
});
