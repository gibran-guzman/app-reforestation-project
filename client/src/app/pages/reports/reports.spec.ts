import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Chart } from 'chart.js';
import Reports from './reports';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import type { SurvivalReport, SpeciesStat, ZoneSummary } from '../../models';

describe('Reports', () => {
  let reportsSvc: jasmine.SpyObj<ReportsService>;
  let speciesSvc: jasmine.SpyObj<SpeciesService>;
  let zoneSvc: jasmine.SpyObj<ZoneService>;

  const mockSurvivalReport: SurvivalReport = {
    overall: { total: 100, monitored: 80, alive: 50, struggling: 20, dead: 10, unmonitored: 20 },
    bySpecies: [
      { id: 1, common_name: 'Quishua', scientific_name: 'Oreocallis sp.', total_planted: 50, monitored: 40, alive: 30, struggling: 8, dead: 2 },
    ],
    byZone: [
      { id: 1, name: 'Zona Alta', total_plantings: 50, monitored: 40, alive: 30, struggling: 8, dead: 2 },
    ],
  };

  const mockSpeciesStats: SpeciesStat[] = [
    { id: 1, common_name: 'Quishua', scientific_name: 'Oreocallis sp.', total_planted: 80, monitored: 60, alive: 40, struggling: 12, dead: 8 },
  ];

  const mockZoneSummary: ZoneSummary[] = [
    { id: 1, name: 'Zona Alta', total_plantings: 80, monitored: 60, alive: 40, struggling: 12, dead: 8 },
  ];

  beforeEach(async () => {
    const rSvc = jasmine.createSpyObj('ReportsService', ['getSurvivalRate', 'getSpeciesStats', 'getZoneSummary', 'exportPdf']);
    const sSvc = jasmine.createSpyObj('SpeciesService', ['list']);
    const zSvc = jasmine.createSpyObj('ZoneService', ['list']);

    rSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    rSvc.getSpeciesStats.and.returnValue(of({ data: mockSpeciesStats }));
    rSvc.getZoneSummary.and.returnValue(of({ data: mockZoneSummary }));
    sSvc.list.and.returnValue(of({ data: [{ id: 1, common_name: 'Q', scientific_name: 'O' }] }));
    zSvc.list.and.returnValue(of({ data: [{ id: 1, name: 'Z1' }] }));

    reportsSvc = rSvc;
    speciesSvc = sSvc;
    zoneSvc = zSvc;

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ReportsService, useValue: reportsSvc },
        { provide: SpeciesService, useValue: speciesSvc },
        { provide: ZoneService, useValue: zoneSvc },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Reports);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load report data on init', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(reportsSvc.getSurvivalRate).toHaveBeenCalled();
    expect(comp.report()).toEqual(mockSurvivalReport);
    expect(comp.loading()).toBeFalse();
  });

  it('should load species stats on init', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(reportsSvc.getSpeciesStats).toHaveBeenCalled();
    expect(comp.speciesStats()).toEqual(mockSpeciesStats);
  });

  it('should load zone summary on init', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(reportsSvc.getZoneSummary).toHaveBeenCalled();
    expect(comp.zoneSummary()).toEqual(mockZoneSummary);
  });

  it('should load species and zone lists on init', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(speciesSvc.list).toHaveBeenCalled();
    expect(zoneSvc.list).toHaveBeenCalled();
  });

  it('should set error on getSurvivalRate failure', () => {
    reportsSvc.getSurvivalRate.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));
    reportsSvc.getSpeciesStats.and.returnValue(of({ data: mockSpeciesStats }));
    reportsSvc.getZoneSummary.and.returnValue(of({ data: mockZoneSummary }));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Error de red');
    expect(comp.loading()).toBeFalse();
  });

  it('loadData should reload all report data', () => {
    reportsSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.loadData();
    expect(reportsSvc.getSurvivalRate).toHaveBeenCalled();
    expect(reportsSvc.getSpeciesStats).toHaveBeenCalled();
    expect(reportsSvc.getZoneSummary).toHaveBeenCalled();
    expect(comp.loading()).toBeFalse();
  });

  it('filterSpecies and filterZone should be included in API calls', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.filterSpecies.set(2);
    comp.filterZone.set(3);
    comp.loadData();
    const expectedFilters = { species_id: 2, zone_id: 3 };
    expect(reportsSvc.getSurvivalRate).toHaveBeenCalledWith(expectedFilters);
    expect(reportsSvc.getSpeciesStats).toHaveBeenCalledWith(expectedFilters);
    expect(reportsSvc.getZoneSummary).toHaveBeenCalledWith(expectedFilters);
  });

  it('downloadPdf should call exportPdf and trigger download', () => {
    const blob = new Blob(['fake-pdf'], { type: 'application/pdf' });
    reportsSvc.exportPdf.and.returnValue(of(blob));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(window.URL, 'revokeObjectURL');

    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.downloadPdf();
    expect(reportsSvc.exportPdf).toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(comp.downloading()).toBeFalse();
  });

  it('downloadPdf should set downloading false on error', () => {
    reportsSvc.exportPdf.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.downloadPdf();
    expect(comp.downloading()).toBeFalse();
  });

  it('rate should compute percentage', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    expect(comp.rate(30, 100)).toBe(30);
    expect(comp.rate(0, 0)).toBe(0);
  });

  it('progressClass should return correct class', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    expect(comp.progressClass(70, 100)).toBe('bg-success');
    expect(comp.progressClass(40, 100)).toBe('bg-warning');
    expect(comp.progressClass(10, 100)).toBe('bg-danger');
  });

  it('statusLabel should map status codes', () => {
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    expect(comp.statusLabel('alive')).toBe('Vivas');
    expect(comp.statusLabel('struggling')).toBe('Estresadas');
    expect(comp.statusLabel('dead')).toBe('Muertas');
    expect(comp.statusLabel('unknown')).toBe('unknown');
  });

  it('should set default error on getSurvivalRate failure when no server error', () => {
    reportsSvc.getSurvivalRate.and.returnValue(throwError(() => ({})));
    reportsSvc.getSpeciesStats.and.returnValue(of({ data: mockSpeciesStats }));
    reportsSvc.getZoneSummary.and.returnValue(of({ data: mockZoneSummary }));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Error al cargar reportes');
    expect(comp.loading()).toBeFalse();
  });

  it('should set error on getSpeciesStats failure', () => {
    reportsSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    reportsSvc.getSpeciesStats.and.returnValue(throwError(() => ({ error: { error: 'Stats fail' } })));
    reportsSvc.getZoneSummary.and.returnValue(of({ data: mockZoneSummary }));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Stats fail');
    expect(comp.loading()).toBeFalse();
  });

  it('should set default error on getSpeciesStats failure when no server error', () => {
    reportsSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    reportsSvc.getSpeciesStats.and.returnValue(throwError(() => ({})));
    reportsSvc.getZoneSummary.and.returnValue(of({ data: mockZoneSummary }));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Error al cargar estadísticas por especie');
    expect(comp.loading()).toBeFalse();
  });

  it('should set error on getZoneSummary failure', () => {
    reportsSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    reportsSvc.getSpeciesStats.and.returnValue(of({ data: mockSpeciesStats }));
    reportsSvc.getZoneSummary.and.returnValue(throwError(() => ({ error: { error: 'Zone fail' } })));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Zone fail');
    expect(comp.loading()).toBeFalse();
  });

  it('should set default error on getZoneSummary failure when no server error', () => {
    reportsSvc.getSurvivalRate.and.returnValue(of({ data: mockSurvivalReport }));
    reportsSvc.getSpeciesStats.and.returnValue(of({ data: mockSpeciesStats }));
    reportsSvc.getZoneSummary.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(Reports);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.error()).toBe('Error al cargar resumen por zona');
    expect(comp.loading()).toBeFalse();
  });

  describe('chart rendering', () => {
    it('should render survival chart when report and canvas exist', () => {
      const fixture = TestBed.createComponent(Reports);
      const comp = fixture.componentInstance;
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      Object.defineProperty(comp, 'survivalChartRef', { value: () => ({ nativeElement: canvas1 }) });
      Object.defineProperty(comp, 'speciesChartRef', { value: () => ({ nativeElement: canvas2 }) });
      comp['renderSurvivalChart'](mockSurvivalReport, canvas1);
      comp['renderSpeciesChart'](mockSpeciesStats, canvas2);
      expect(comp['survivalChart']).toBeDefined();
      expect(comp['speciesChart']).toBeDefined();
    });

    it('should not render survival chart without report', () => {
      const fixture = TestBed.createComponent(Reports);
      const comp = fixture.componentInstance;
      expect(comp['survivalChart']).toBeNull();
    });

    it('should not render species chart without stats', () => {
      const fixture = TestBed.createComponent(Reports);
      const comp = fixture.componentInstance;
      expect(comp['speciesChart']).toBeNull();
    });

    it('should trigger chart rendering effect when data and canvas refs are available', () => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({ destroy: jasmine.createSpy('destroy') }));
      const fixture = TestBed.createComponent(Reports);
      const comp = fixture.componentInstance;
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      Object.defineProperty(comp, 'survivalChartRef', { value: () => ({ nativeElement: canvas1 }) });
      Object.defineProperty(comp, 'speciesChartRef', { value: () => ({ nativeElement: canvas2 }) });
      spyOn(comp as any, 'renderSurvivalChart').and.callThrough();
      comp.report.set(mockSurvivalReport);
      comp.speciesStats.set(mockSpeciesStats);
      fixture.detectChanges();
      expect((comp as any).renderSurvivalChart).toHaveBeenCalled();
      expect((comp as any)['survivalChart']).toBeDefined();
    });
  });
});
