import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSoilTextures', () => {
    it('returns soil textures', () => {
      const mock = { data: [{ value: 'sandy', label: 'Arenoso' }, { value: 'clay', label: 'Arcilloso' }] };

      service.getSoilTextures().subscribe(res => {
        expect(res.data.length).toBe(2);
        expect(res.data[0].value).toBe('sandy');
      });

      const req = httpTesting.expectOne('/api/config/soil-textures');
      expect(req.request.method).toBe('GET');
      req.flush(mock);
    });

    it('handles error', () => {
      let error: any;
      service.getSoilTextures().subscribe({ error: e => { error = e; } });

      const req = httpTesting.expectOne('/api/config/soil-textures');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(error.status).toBe(404);
    });

    it('handles empty array', () => {
      service.getSoilTextures().subscribe(res => {
        expect(res.data).toEqual([]);
      });

      const req = httpTesting.expectOne('/api/config/soil-textures');
      req.flush({ data: [] });
    });
  });
});
