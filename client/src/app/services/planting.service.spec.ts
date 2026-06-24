import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PlantingService } from './planting.service';

describe('PlantingService', () => {
  let service: PlantingService;
  let httpTesting: HttpTestingController;

  const mockPlanting = {
    id: 1,
    zone_id: 1,
    species_id: 2,
    location: { type: 'Point', coordinates: [-78.5, -0.2] },
    planted_at: '2024-06-01T00:00:00Z',
    planted_by: 'Test User',
    initial_ph: 6.5,
    initial_humidity: 70,
    initial_soil_texture: 'loam',
    photo_url: null,
    created_at: '2024-06-01T00:00:00Z',
    species_name: 'Polylepis',
    zone_name: 'Zone A',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlantingService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    const mockPaginated = {
      data: [mockPlanting],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    it('sends GET with default pagination', () => {
      service.list().subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('50');
      req.flush(mockPaginated);
    });

    it('sends custom pagination', () => {
      service.list(2, 10).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockPaginated);
    });

    it('sends filters', () => {
      service.list(1, 50, { zone_id: 3, species_id: 4, from: '2024-01', to: '2024-12' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings');
      expect(req.request.params.get('zone_id')).toBe('3');
      expect(req.request.params.get('species_id')).toBe('4');
      expect(req.request.params.get('from')).toBe('2024-01');
      expect(req.request.params.get('to')).toBe('2024-12');
      req.flush(mockPaginated);
    });

    it('omits undefined filters', () => {
      service.list(1, 50, { zone_id: undefined }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings');
      expect(req.request.params.has('zone_id')).toBeFalse();
      req.flush(mockPaginated);
    });

    it('handles error', () => {
      let error: any;
      service.list().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne(r => r.url === '/api/plantings');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('getById', () => {
    it('fetches a planting by id', () => {
      service.getById(1).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/plantings/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPlanting });
    });

    it('handles not found', () => {
      let error: any;
      service.getById(999).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/plantings/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(error.status).toBe(404);
    });
  });

  describe('create', () => {
    it('sends POST request', () => {
      const body = { zone_id: 1, species_id: 2, location: { lat: -0.2, lng: -78.5 } };

      service.create(body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/plantings');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ data: mockPlanting });
    });

    it('handles validation error', () => {
      let error: any;
      const body = { zone_id: 0, species_id: 0, location: { lat: 0, lng: 0 } };
      service.create(body).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/plantings');
      req.flush({ message: 'Invalid' }, { status: 400, statusText: 'Bad Request' });
      expect(error.status).toBe(400);
    });
  });

  describe('syncBatch', () => {
    it('sends items array', () => {
      const items = [
        { zone_id: 1, species_id: 2, location: { lat: -0.2, lng: -78.5 } },
      ];

      service.syncBatch(items).subscribe(res => {
        expect(res.data.length).toBe(1);
      });

      const req = httpTesting.expectOne('/api/plantings/sync');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ items });
      req.flush({ data: [{ index: 0, status: 'success', data: mockPlanting }] });
    });

    it('handles conflict resolution', () => {
      const items = [
        { zone_id: 1, species_id: 2, location: { lat: -0.2, lng: -78.5 } },
      ];

      service.syncBatch(items).subscribe(res => {
        expect(res.data[0].conflict).toBe('resolved');
      });

      const req = httpTesting.expectOne('/api/plantings/sync');
      req.flush({ data: [{ index: 0, status: 'success', data: mockPlanting, conflict: 'resolved' }] });
    });

    it('handles batch error', () => {
      let error: any;
      service.syncBatch([]).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/plantings/sync');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('getGeoJson', () => {
    const mockGeoJson = {
      type: 'FeatureCollection',
      features: [],
    };

    it('fetches geojson without filters', () => {
      service.getGeoJson().subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings/geojson');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockGeoJson);
    });

    it('fetches geojson with filters', () => {
      service.getGeoJson({ zone_id: 1, species_id: 2, from: '2024-01', to: '2024-12' }).subscribe();

      const req = httpTesting.expectOne(r => r.url === '/api/plantings/geojson');
      expect(req.request.params.get('zone_id')).toBe('1');
      expect(req.request.params.get('species_id')).toBe('2');
      expect(req.request.params.get('from')).toBe('2024-01');
      expect(req.request.params.get('to')).toBe('2024-12');
      req.flush(mockGeoJson);
    });

    it('handles error', () => {
      let error: any;
      service.getGeoJson().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne(r => r.url === '/api/plantings/geojson');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('uploadPhoto', () => {
    it('sends FormData POST', () => {
      const file = new File(['photo-data'], 'plant.jpg', { type: 'image/jpeg' });

      service.uploadPhoto(1, file).subscribe(res => {
        expect(res.data.photo_url).toBe('http://example.com/photo.jpg');
      });

      const req = httpTesting.expectOne('/api/plantings/1/photo');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ data: { photo_url: 'http://example.com/photo.jpg' } });
    });

    it('handles upload error', () => {
      let error: any;
      const file = new File(['data'], 'test.jpg');
      service.uploadPhoto(1, file).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/plantings/1/photo');
      req.flush({ message: 'Upload failed' }, { status: 413, statusText: 'Payload Too Large' });
      expect(error.status).toBe(413);
    });
  });
});
