import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SpeciesService } from './species.service';

describe('SpeciesService', () => {
  let service: SpeciesService;
  let httpTesting: HttpTestingController;

  const mockSpecies = {
    id: 1,
    scientific_name: 'Polylepis racemosa',
    common_name: 'Polylepis',
    description: 'Altoandina tree',
    ideal_soil_type: 'loam',
    recommended_altitude_min: 3000,
    recommended_altitude_max: 4500,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpeciesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('returns all species', () => {
      const mock = { data: [mockSpecies] };

      service.list().subscribe(res => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].common_name).toBe('Polylepis');
      });

      const req = httpTesting.expectOne('/api/species');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('handles empty list', () => {
      service.list().subscribe(res => {
        expect(res.data).toEqual([]);
      });

      const req = httpTesting.expectOne('/api/species');
      req.flush({ data: [] });
    });

    it('handles error', () => {
      let error: any;
      service.list().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/species');
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });
  });

  describe('getById', () => {
    it('fetches a species by id', () => {
      service.getById(1).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/species/1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockSpecies });
    });

    it('handles not found', () => {
      let error: any;
      service.getById(999).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/species/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(error.status).toBe(404);
    });
  });

  describe('create', () => {
    it('sends POST request', () => {
      const body = { scientific_name: 'New Species', common_name: 'New' };

      service.create(body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/species');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ data: mockSpecies });
    });

    it('handles validation error', () => {
      let error: any;
      service.create({ scientific_name: '', common_name: '' }).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/species');
      req.flush({ message: 'Invalid' }, { status: 400, statusText: 'Bad Request' });
      expect(error.status).toBe(400);
    });
  });

  describe('update', () => {
    it('sends PUT request', () => {
      const body = { common_name: 'Updated' };

      service.update(1, body).subscribe(res => {
        expect(res.data.id).toBe(1);
      });

      const req = httpTesting.expectOne('/api/species/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ data: { ...mockSpecies, common_name: 'Updated' } });
    });

    it('handles not found on update', () => {
      let error: any;
      service.update(999, { common_name: 'X' }).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/species/999');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
      expect(error.status).toBe(404);
    });
  });

  describe('remove', () => {
    it('sends DELETE request', () => {
      service.remove(1).subscribe(res => {
        expect(res.message).toBe('Deleted');
      });

      const req = httpTesting.expectOne('/api/species/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
    });

    it('handles error on delete', () => {
      let error: any;
      service.remove(1).subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/species/1');
      req.flush({ message: 'Cannot delete' }, { status: 409, statusText: 'Conflict' });
      expect(error.status).toBe(409);
    });
  });
});
