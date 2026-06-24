import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import PlantingDetail from './planting-detail';
import { PlantingService } from '../../../services/planting.service';
import { MonitoringService } from '../../../services/monitoring.service';

const mockPlanting = {
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
};

const mockMonitoring = {
  id: 1,
  planting_site_id: 1,
  visit_date: '2024-06-01T00:00:00Z',
  ph: null,
  humidity: null,
  soil_texture: null,
  survival_status: 'alive' as const,
  vigor: null,
  notes: 'Good',
  photo_url: null,
  monitored_by: null,
  created_at: '2024-06-01T00:00:00Z',
};

describe('PlantingDetail', () => {
  let plantingService: jasmine.SpyObj<PlantingService>;
  let monitoringService: jasmine.SpyObj<MonitoringService>;

  beforeEach(async () => {
    const plantingSpy = jasmine.createSpyObj('PlantingService', ['getById']);
    const monitoringSpy = jasmine.createSpyObj('MonitoringService', ['getByPlantingSiteId']);

    await TestBed.configureTestingModule({
      imports: [PlantingDetail],
      providers: [
        provideHttpClient(),
        { provide: PlantingService, useValue: plantingSpy },
        { provide: MonitoringService, useValue: monitoringSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();

    plantingService = TestBed.inject(PlantingService) as jasmine.SpyObj<PlantingService>;
    monitoringService = TestBed.inject(MonitoringService) as jasmine.SpyObj<MonitoringService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlantingDetail);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load planting and monitoring on init', () => {
    plantingService.getById.and.returnValue(of({ data: mockPlanting }));
    monitoringService.getByPlantingSiteId.and.returnValue(of({ data: [mockMonitoring] }));

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(plantingService.getById).toHaveBeenCalledWith(1);
    expect(monitoringService.getByPlantingSiteId).toHaveBeenCalledWith(1);
    expect(comp.planting()).toEqual(mockPlanting as any);
    expect(comp.monitoring()).toEqual([mockMonitoring] as any);
    expect(comp.loading()).toBeFalse();
  });

  it('should set error when id is invalid', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = () => null;

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('ID de plantación inválido');
    expect(comp.loading()).toBeFalse();
  });

  it('should set error on planting load failure', () => {
    plantingService.getById.and.returnValue(throwError(() => ({ error: { error: 'No encontrado' } })));

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('No encontrado');
    expect(comp.loading()).toBeFalse();
  });

  it('should set error on monitoring load failure', () => {
    plantingService.getById.and.returnValue(of({ data: mockPlanting }));
    monitoringService.getByPlantingSiteId.and.returnValue(throwError(() => ({ error: { error: 'Error de monitoreo' } })));

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error de monitoreo');
    expect(comp.loading()).toBeFalse();
  });

  it('should set default error on planting load failure when no server error', () => {
    plantingService.getById.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error al cargar la plantación');
    expect(comp.loading()).toBeFalse();
  });

  it('should set default error on monitoring load failure when no server error', () => {
    plantingService.getById.and.returnValue(of({ data: mockPlanting }));
    monitoringService.getByPlantingSiteId.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error al cargar el historial de monitoreo');
    expect(comp.loading()).toBeFalse();
  });

  it('survivalBadge should return correct classes', () => {
    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    expect(comp.survivalBadge('alive')).toBe('bg-success');
    expect(comp.survivalBadge('struggling')).toBe('bg-warning text-dark');
    expect(comp.survivalBadge('dead')).toBe('bg-danger');
    expect(comp.survivalBadge('unknown')).toBe('bg-secondary');
  });

  it('survivalLabel should return correct labels', () => {
    const fixture = TestBed.createComponent(PlantingDetail);
    const comp = fixture.componentInstance;
    expect(comp.survivalLabel('alive')).toBe('Vivo');
    expect(comp.survivalLabel('struggling')).toBe('Estresado');
    expect(comp.survivalLabel('dead')).toBe('Muerto');
    expect(comp.survivalLabel('unknown')).toBe('unknown');
  });
});
