import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let httpTesting: HttpTestingController;

  const mockRecord = {
    id: 1,
    planting_site_id: 10,
    visit_date: '2024-06-01',
    ph: 6.5,
    humidity: 70,
    soil_texture: 'loam',
    survival_status: 'alive' as const,
    vigor: 'high' as const,
    notes: 'Healthy',
    photo_url: null,
    monitored_by: 'Test User',
    created_at: '2024-06-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MonitoringService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getByPlantingSiteId', () => {
    it('fetches monitoring records for a planting site', () => {
      const mock = { data: [mockRecord] };

      service.getByPlantingSiteId(10).subscribe(res => {
        expect(res.data.length).toBe(1);
      });

      const req = httpTesting.expectOne('/api/monitoring/planting/10');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('handles empty response', () => {
      service.getByPlantingSiteId(99).subscribe(res => {
        expect(res.data).toEqual([]);
      });

      const req = httpTesting.expectOne('/api/monitoring/planting/99');
      req.flush({ data: [] });
    });

    it('handles error', () => {
      let error: any;
      service.getByPlantingSiteId(10).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/monitoring/planting/10');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(error.status).toBe(404);
    });
  });

  describe('getById', () => {
    it('fetches a single record', () => {
      service.getById(1).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/monitoring/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRecord });
    });

    it('handles error', () => {
      let error: any;
      service.getById(999).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/monitoring/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(error.status).toBe(404);
    });
  });

  describe('create', () => {
    it('sends POST request', () => {
      const body = { planting_site_id: 10, survival_status: 'alive' as const };

      service.create(body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/monitoring');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ data: mockRecord });
    });

    it('handles validation error', () => {
      let error: any;
      service.create({ planting_site_id: 0, survival_status: 'alive' as const }).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/monitoring');
      req.flush({ message: 'Invalid data' }, { status: 400, statusText: 'Bad Request' });

      expect(error.status).toBe(400);
    });
  });
});
