import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ZoneService } from './zone.service';

describe('ZoneService', () => {
  let service: ZoneService;
  let httpTesting: HttpTestingController;

  const mockZone = {
    id: 1,
    name: 'Zone A',
    description: 'Test zone',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-78.5, -0.2], [-78.5, -0.3], [-78.4, -0.3], [-78.4, -0.2], [-78.5, -0.2]]],
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ZoneService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('returns all zones', () => {
      const mock = { data: [mockZone] };

      service.list().subscribe(res => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].name).toBe('Zone A');
      });

      const req = httpTesting.expectOne('/api/zones');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('handles empty list', () => {
      service.list().subscribe(res => {
        expect(res.data).toEqual([]);
      });

      const req = httpTesting.expectOne('/api/zones');
      req.flush({ data: [] });
    });

    it('handles error', () => {
      let error: any;
      service.list().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/zones');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('getById', () => {
    it('fetches a zone by id', () => {
      service.getById(1).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/zones/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockZone });
    });

    it('handles not found', () => {
      let error: any;
      service.getById(999).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/zones/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(error.status).toBe(404);
    });
  });

  describe('create', () => {
    it('sends POST request', () => {
      const body = { name: 'New Zone', description: 'Desc' };

      service.create(body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/zones');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ data: mockZone });
    });

    it('handles validation error', () => {
      let error: any;
      service.create({ name: '' }).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/zones');
      req.flush({ message: 'Invalid' }, { status: 400, statusText: 'Bad Request' });
      expect(error.status).toBe(400);
    });
  });

  describe('update', () => {
    it('sends PUT request', () => {
      const body = { name: 'Updated Zone' };

      service.update(1, body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/zones/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ data: { ...mockZone, name: 'Updated Zone' } });
    });

    it('handles not found on update', () => {
      let error: any;
      service.update(999, { name: 'X' }).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/zones/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(error.status).toBe(404);
    });
  });

  describe('remove', () => {
    it('sends DELETE request', () => {
      service.remove(1).subscribe(res => {
        expect(res.message).toBe('Deleted');
      });

      const req = httpTesting.expectOne('/api/zones/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
    });

    it('handles error on delete', () => {
      let error: any;
      service.remove(1).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/zones/1');
      req.flush({ message: 'Cannot delete' }, { status: 409, statusText: 'Conflict' });
      expect(error.status).toBe(409);
    });
  });
});
