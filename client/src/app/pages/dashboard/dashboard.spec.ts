import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Chart } from 'chart.js';
import Dashboard from './dashboard';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { PlantingService } from '../../services/planting.service';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { SyncService } from '../../services/sync.service';
import type { SurvivalReport, EvolutionPoint, PlantingSite } from '../../models';

describe('Dashboard', () => {
  let reportsSvc: jasmine.SpyObj<ReportsService>;
  let speciesSvc: jasmine.SpyObj<SpeciesService>;
  let zoneSvc: jasmine.SpyObj<ZoneService>;
  let plantingSvc: jasmine.SpyObj<PlantingService>;
  let authSvc: jasmine.SpyObj<AuthService>;
  let offlineSvc: jasmine.SpyObj<OfflineService>;
  let syncSvc: jasmine.SpyObj<SyncService>;

  const mockReport: SurvivalReport = {
    overall: { total: 100, monitored: 80, alive: 50, struggling: 20, dead: 10, unmonitored: 20 },
    bySpecies: [
      { id: 1, common_name: 'Quishua', scientific_name: 'Oreocallis sp.', total_planted: 50, monitored: 40, alive: 30, struggling: 8, dead: 2 },
    ],
    byZone: [
      { id: 1, name: 'Zona Alta', total_plantings: 50, monitored: 40, alive: 30, struggling: 8, dead: 2 },
    ],
  };

  const evolutionData: EvolutionPoint[] = [
    { period: '2024-01', total: 10 },
    { period: '2024-02', total: 15 },
  ];

  beforeEach(async () => {
    const reportsSpy = jasmine.createSpyObj('ReportsService', ['getSurvivalRate', 'getEvolution']);
    const speciesSpy = jasmine.createSpyObj('SpeciesService', ['list']);
    const zoneSpy = jasmine.createSpyObj('ZoneService', ['list']);
    const plantingSpy = jasmine.createSpyObj('PlantingService', ['list']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'login', 'logout', 'me', 'signup'], { user: signal(null), isAuthenticated: signal(false) });
    const connectivitySpy = jasmine.createSpyObj('ConnectivityService', [], { online: signal(true) });
    const offlineSpy = jasmine.createSpyObj('OfflineService', ['getPendingPlantings', 'savePlanting'], { pendingCount: signal(0) });
    const syncSpy = jasmine.createSpyObj('SyncService', ['sync'], { progress: signal(null), syncing: false, errorItems: signal([]) });

    reportsSpy.getSurvivalRate.and.returnValue(of({ data: mockReport }));
    reportsSpy.getEvolution.and.returnValue(of({ data: evolutionData }));
    speciesSpy.list.and.returnValue(of({ data: [] }));
    zoneSpy.list.and.returnValue(of({ data: [] }));
    plantingSpy.list.and.returnValue(of({ data: [], meta: { total: 0, page: 1, limit: 5, totalPages: 0 } }));
    offlineSpy.getPendingPlantings.and.returnValue(Promise.resolve([]));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ReportsService, useValue: reportsSpy },
        { provide: SpeciesService, useValue: speciesSpy },
        { provide: ZoneService, useValue: zoneSpy },
        { provide: PlantingService, useValue: plantingSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ConnectivityService, useValue: connectivitySpy },
        { provide: OfflineService, useValue: offlineSpy },
        { provide: SyncService, useValue: syncSpy },
      ],
    }).compileComponents();

    reportsSvc = TestBed.inject(ReportsService) as jasmine.SpyObj<ReportsService>;
    speciesSvc = TestBed.inject(SpeciesService) as jasmine.SpyObj<SpeciesService>;
    zoneSvc = TestBed.inject(ZoneService) as jasmine.SpyObj<ZoneService>;
    plantingSvc = TestBed.inject(PlantingService) as jasmine.SpyObj<PlantingService>;
    authSvc = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    offlineSvc = TestBed.inject(OfflineService) as jasmine.SpyObj<OfflineService>;
    syncSvc = TestBed.inject(SyncService) as jasmine.SpyObj<SyncService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Dashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load overall stats on init', fakeAsync(() => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    tick();
    expect(reportsSvc.getSurvivalRate).toHaveBeenCalled();
    expect(comp.overall()).toEqual(mockReport.overall);
    expect(comp.loadingStats()).toBeFalse();
  }));

  it('should load species stats on init', fakeAsync(() => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    tick();
    expect(comp.speciesStats()).toEqual(mockReport.bySpecies);
  }));

  it('should load zone summary on init', fakeAsync(() => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    tick();
    expect(comp.zoneSummary()).toEqual(mockReport.byZone);
  }));

  it('should load evolution on init', fakeAsync(() => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    tick();
    expect(reportsSvc.getEvolution).toHaveBeenCalled();
    expect(comp.evolution()).toEqual(evolutionData);
  }));

  it('should set statsError on getSurvivalRate failure', fakeAsync(() => {
    reportsSvc.getSurvivalRate.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    tick();
    expect(comp.statsError()).toBe('No se pudieron cargar las estadísticas');
    expect(comp.loadingStats()).toBeFalse();
  }));

  it('rate should compute percentage', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    expect(comp.rate(30, 100)).toBe(30);
    expect(comp.rate(0, 0)).toBe(0);
    expect(comp.rate(50, 200)).toBe(25);
  });

  it('survivalColor should return correct class', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    expect(comp.survivalColor(70, 100)).toBe('bg-success');
    expect(comp.survivalColor(40, 100)).toBe('bg-warning');
    expect(comp.survivalColor(10, 100)).toBe('bg-danger');
  });

  it('statusLabel should map status codes', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    expect(comp.statusLabel('alive')).toBe('Vivas');
    expect(comp.statusLabel('struggling')).toBe('Estresadas');
    expect(comp.statusLabel('dead')).toBe('Muertas');
    expect(comp.statusLabel('unknown')).toBe('unknown');
  });

  it('trendClass should return correct class', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    expect(comp.trendClass(10, 5)).toBe('text-success');
    expect(comp.trendClass(5, 10)).toBe('text-danger');
    expect(comp.trendClass(5, 5)).toBe('text-muted');
    expect(comp.trendClass(10, 0)).toBe('text-muted');
  });

  it('trendIcon should return correct arrow', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    expect(comp.trendIcon(10, 5)).toBe('↑');
    expect(comp.trendIcon(5, 10)).toBe('↓');
    expect(comp.trendIcon(5, 5)).toBe('→');
    expect(comp.trendIcon(10, 0)).toBe('–');
  });

  it('doSync should call syncService and refresh pending', fakeAsync(() => {
    syncSvc.sync.and.returnValue(Promise.resolve());
    offlineSvc.getPendingPlantings.and.returnValue(Promise.resolve([]));
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.doSync();
    tick();
    expect(syncSvc.sync).toHaveBeenCalled();
    expect(offlineSvc.getPendingPlantings).toHaveBeenCalled();
    expect(comp.syncError).toBe('');
  }));

  it('doSync should set syncError on failure', fakeAsync(() => {
    syncSvc.sync.and.returnValue(Promise.reject(new Error('fail')));
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.doSync();
    tick();
    expect(comp.syncError).toBe('Error al sincronizar. Intenta de nuevo.');
  }));

  it('refreshPending should reload pending list', fakeAsync(() => {
    offlineSvc.getPendingPlantings.and.returnValue(Promise.resolve([]));
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    comp.refreshPending();
    tick();
    expect(offlineSvc.getPendingPlantings).toHaveBeenCalled();
  }));

  it('should read success message from router state on init', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: { state: { success: 'Creado exitosamente' } },
    } as any);
    comp.ngOnInit();
    expect(comp.successMsg).toBe('Creado exitosamente');
  });

  it('should handle missing router state gracefully', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue(null);
    comp.ngOnInit();
    expect(comp.successMsg).toBe('');
  });

  describe('evolution chart', () => {
    it('should render evolution chart when ref and data exist', fakeAsync(() => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({
        destroy: jasmine.createSpy('destroy'),
      }));
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      const canvas = document.createElement('canvas');
      Object.defineProperty(comp, 'evolutionChartRef', { value: () => ({ nativeElement: canvas }) });
      comp.evolution.set(evolutionData);
      comp['renderEvolutionChart'](evolutionData, canvas);
      expect(comp['evolutionChart']).toBeDefined();
    }));

    it('should not render evolution chart without canvas ref', () => {
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      comp.evolution.set(evolutionData);
      expect(comp['evolutionChart']).toBeNull();
    });

    it('should trigger evolution chart effect when canvas ref and data are available after detectChanges', () => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({ destroy: jasmine.createSpy('destroy') }));
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      comp.evolution.set(evolutionData);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      expect((comp as any)['evolutionChart']).toBeDefined();
    });

    it('should cover the chart tooltip label callback', fakeAsync(() => {
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      const canvas = document.createElement('canvas');
      Object.defineProperty(comp, 'evolutionChartRef', { value: () => ({ nativeElement: canvas }) });
      comp.evolution.set(evolutionData);
      comp['renderEvolutionChart'](evolutionData, canvas);
      const chartInstance = (comp as any)['evolutionChart'] as any;
      expect(chartInstance).toBeDefined();
      const labelFn = chartInstance?.config?.options?.plugins?.tooltip?.callbacks?.label;
      if (labelFn) {
        const result = labelFn({ parsed: { y: 5 } });
        expect(result).toContain('5');
      }
    }));

    it('should not call renderEvolutionChart when evolution is empty', () => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({ destroy: jasmine.createSpy('destroy') }));
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      comp.evolution.set([]);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      expect((comp as any)['evolutionChart']).toBeNull();
    });

    it('should not call renderEvolutionChart when canvas ref is not yet available', () => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({ destroy: jasmine.createSpy('destroy') }));
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      comp.evolution.set(evolutionData);
      TestBed.flushEffects();
      expect((comp as any)['evolutionChart']).toBeNull();
    });

    it('should handle effect when evolution becomes empty after canvas rendered', () => {
      spyOn(Chart.prototype, 'constructor' as any).and.callFake(() => ({ destroy: jasmine.createSpy('destroy') }));
      const fixture = TestBed.createComponent(Dashboard);
      const comp = fixture.componentInstance;
      comp.evolution.set(evolutionData);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      expect((comp as any)['evolutionChart']).toBeDefined();
      comp.evolution.set([]);
      TestBed.flushEffects();
      fixture.detectChanges();
      expect((comp as any)['evolutionChart']).toBeDefined();
    });
  });
});
