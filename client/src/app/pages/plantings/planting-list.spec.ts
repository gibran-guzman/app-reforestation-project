import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import PlantingList from './planting-list';
import { PlantingService } from '../../services/planting.service';
import type { PaginatedResponse, PlantingSite } from '../../models';

const mockSite = (overrides: Partial<PlantingSite> = {}): PlantingSite => ({
  id: 1,
  zone_id: 1,
  species_id: 1,
  location: { type: 'Point' as const, coordinates: [0, 0] },
  planted_at: '2024-01-01T00:00:00Z',
  planted_by: null,
  initial_ph: null,
  initial_humidity: null,
  initial_soil_texture: null,
  photo_url: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('PlantingList', () => {
  let service: jasmine.SpyObj<PlantingService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('PlantingService', ['list']);

    await TestBed.configureTestingModule({
      imports: [PlantingList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PlantingService, useValue: spy },
      ],
    }).compileComponents();

    service = TestBed.inject(PlantingService) as jasmine.SpyObj<PlantingService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlantingList);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load plantings on init', () => {
    const mockData: PaginatedResponse<PlantingSite[]> = {
      data: [mockSite()],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    };
    service.list.and.returnValue(of(mockData));

    const fixture = TestBed.createComponent(PlantingList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(service.list).toHaveBeenCalledWith(1);
    expect(comp.plantings()).toEqual(mockData.data);
    expect(comp.meta()).toEqual(mockData.meta);
    expect(comp.loading()).toBeFalse();
  });

  it('loadPage should call service.list and set plantings on success', () => {
    const mockData: PaginatedResponse<PlantingSite[]> = {
      data: [mockSite({ id: 2 })],
      meta: { total: 1, page: 2, limit: 50, totalPages: 1 },
    };
    service.list.and.returnValue(of(mockData));

    const fixture = TestBed.createComponent(PlantingList);
    const comp = fixture.componentInstance;
    comp.loadPage(2);

    expect(service.list).toHaveBeenCalledWith(2);
    expect(comp.currentPage()).toBe(2);
    expect(comp.plantings()).toEqual(mockData.data);
    expect(comp.loading()).toBeFalse();
  });

  it('loadPage should set error on failure', () => {
    service.list.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));

    const fixture = TestBed.createComponent(PlantingList);
    const comp = fixture.componentInstance;
    comp.loadPage(1);

    expect(comp.error()).toBe('Error de red');
    expect(comp.loading()).toBeFalse();
  });

  it('loadPage should set default error message when no server error', () => {
    service.list.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(PlantingList);
    const comp = fixture.componentInstance;
    comp.loadPage(1);

    expect(comp.error()).toBe('Error al cargar plantaciones');
  });

  it('pageArray should return correct array', () => {
    const fixture = TestBed.createComponent(PlantingList);
    const comp = fixture.componentInstance;
    expect(comp.pageArray(3)).toEqual([0, 1, 2]);
    expect(comp.pageArray(0)).toEqual([]);
    expect(comp.pageArray(1)).toEqual([0]);
  });
});
