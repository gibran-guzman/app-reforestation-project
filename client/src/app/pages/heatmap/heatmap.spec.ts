import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import L from 'leaflet';
import HeatmapPage from './heatmap';
import { AnalyticsService, type HeatmapResponse } from '../../services/analytics.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';

describe('HeatmapPage', () => {
  let analyticsSvc: jasmine.SpyObj<AnalyticsService>;
  let speciesSvc: jasmine.SpyObj<SpeciesService>;
  let zoneSvc: jasmine.SpyObj<ZoneService>;

  const mockMap = jasmine.createSpyObj('Map', ['on', 'remove', 'setView', 'invalidateSize', 'addLayer', 'addTo']);
  const mockTileLayer = jasmine.createSpyObj('TileLayer', ['addTo']);
  const mockHeatLayer = jasmine.createSpyObj('HeatLayer', ['addTo', 'setLatLngs']);

  const mockHeatmapResponse: HeatmapResponse = {
    periods: [
      { label: 'Ene 2024', data: [{ lat: -0.22, lng: -78.52, weight: 0.8 }, { lat: -0.23, lng: -78.53, weight: 0.5 }] },
      { label: 'Feb 2024', data: [{ lat: -0.22, lng: -78.52, weight: 0.9 }] },
    ],
    total: 3,
  };

  const emptyResponse: HeatmapResponse = {
    periods: [],
    total: 0,
  };

  beforeEach(async () => {
    mockTileLayer.addTo.and.returnValue(mockMap);
    mockHeatLayer.addTo.and.returnValue(mockHeatLayer);

    const aSvc = jasmine.createSpyObj('AnalyticsService', ['getHeatmap']);
    const sSvc = jasmine.createSpyObj('SpeciesService', ['list']);
    const zSvc = jasmine.createSpyObj('ZoneService', ['list']);

    aSvc.getHeatmap.and.returnValue(of(mockHeatmapResponse));
    sSvc.list.and.returnValue(of({ data: [{ id: 1, common_name: 'Q', scientific_name: 'O' }] }));
    zSvc.list.and.returnValue(of({ data: [{ id: 1, name: 'Z1' }] }));

    analyticsSvc = aSvc;
    speciesSvc = sSvc;
    zoneSvc = zSvc;

    spyOn(L, 'map').and.returnValue(mockMap as any);
    spyOn(L, 'tileLayer').and.returnValue(mockTileLayer as any);
    spyOn(L, 'heatLayer').and.returnValue(mockHeatLayer as any);

    await TestBed.configureTestingModule({
      imports: [HeatmapPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AnalyticsService, useValue: analyticsSvc },
        { provide: SpeciesService, useValue: speciesSvc },
        { provide: ZoneService, useValue: zoneSvc },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockHeatLayer.setLatLngs.calls.reset();
    mockHeatLayer.addTo.calls.reset();
    mockMap.remove.calls.reset();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initMap should call L.map and L.heatLayer', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    fixture.componentInstance['initMap']();
    expect(L.map).toHaveBeenCalledWith('heatmap-container', { center: [-0.229, -78.524], zoom: 12 });
    expect(L.tileLayer).toHaveBeenCalled();
    expect(L.heatLayer).toHaveBeenCalledWith([], jasmine.objectContaining({ radius: 30, blur: 20, maxZoom: 17 }));
    expect(mockHeatLayer.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('loadData should call analytics service and render first period', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.loadData();
    expect(analyticsSvc.getHeatmap).toHaveBeenCalled();
    expect(comp.data()).toEqual(mockHeatmapResponse);
    expect(comp.total()).toBe(3);
    expect(comp.loading()).toBeFalse();
  });

  it('loadData should set error on failure', () => {
    analyticsSvc.getHeatmap.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.loadData();
    expect(comp.error()).toBe('Error de red');
    expect(comp.loading()).toBeFalse();
  });

  it('loadData should set default error when no server error', () => {
    analyticsSvc.getHeatmap.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.loadData();
    expect(comp.error()).toBe('Error al cargar datos del mapa de calor');
    expect(comp.loading()).toBeFalse();
  });

  it('renderPeriod should update heatLayer with points from given index', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.data.set(mockHeatmapResponse);
    comp['renderPeriod'](1);
    expect(comp.currentPeriod()).toBe(1);
    expect(mockHeatLayer.setLatLngs).toHaveBeenCalledWith([[-0.22, -78.52, 0.9]]);
  });

  it('goToPeriod should update to valid index', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    comp.goToPeriod(0);
    expect(comp.currentPeriod()).toBe(0);
  });

  it('goToPeriod should ignore invalid index', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    comp.goToPeriod(-1);
    expect(comp.currentPeriod()).toBe(0);
    comp.goToPeriod(99);
    expect(comp.currentPeriod()).toBe(0);
  });

  it('togglePlay should animate through periods and stop at end', fakeAsync(() => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    comp.togglePlay();
    expect(comp.playing()).toBeTrue();
    tick(1200);
    expect(comp.currentPeriod()).toBe(1);
    tick(1200);
    expect(comp.currentPeriod()).toBe(0);
    expect(comp.playing()).toBeFalse();
  }));

  it('togglePlay should stop animation when already playing', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    comp.togglePlay();
    expect(comp.playing()).toBeTrue();
    comp.togglePlay();
    expect(comp.playing()).toBeFalse();
  });

  it('onIntervalChange should reload data', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    spyOn(comp, 'loadData');
    comp.onIntervalChange();
    expect(comp.loadData).toHaveBeenCalled();
  });

  it('periods getter should return periods from data', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    expect(comp.periods.length).toBe(2);
    expect(comp.periods[0].label).toBe('Ene 2024');
  });

  it('currentLabel getter should return label of current period', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    expect(comp.currentLabel).toBe('Ene 2024');
    comp.goToPeriod(1);
    expect(comp.currentLabel).toBe('Feb 2024');
  });

  it('currentLabel getter should return empty string when no periods', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(emptyResponse);
    expect(comp.currentLabel).toBe('');
  });

  it('currentPoints getter should return points of current period', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    expect(comp.currentPoints.length).toBe(2);
    comp.goToPeriod(1);
    expect(comp.currentPoints.length).toBe(1);
  });

  it('currentPoints getter should return empty array when no periods', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(emptyResponse);
    expect(comp.currentPoints).toEqual([]);
  });

  it('maxIndex getter should return max index', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(mockHeatmapResponse);
    expect(comp.maxIndex).toBe(1);
  });

  it('maxIndex getter should return 0 when no periods', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set(emptyResponse);
    expect(comp.maxIndex).toBe(0);
  });

  it('renderPeriod with empty data should set period index and clear heatLayer', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    const localEmpty: HeatmapResponse = {
      periods: [{ label: 'Empty', data: [] }],
      total: 0,
    };
    comp.data.set(localEmpty);
    comp['renderPeriod'](0);
    expect(comp.currentPeriod()).toBe(0);
    expect(mockHeatLayer.setLatLngs).toHaveBeenCalledWith([]);
  });

  it('buildFilters should include interval', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.interval.set('year');
    const filters = comp['buildFilters']();
    expect(filters).toEqual({ interval: 'year' });
  });

  it('buildFilters should include species and zone filters when set', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.filterSpecies.set(1);
    comp.filterZone.set(2);
    comp.interval.set('month');
    const filters = comp['buildFilters']();
    expect(filters).toEqual({ species_id: 1, zone_id: 2, interval: 'month' });
  });

  it('should stop animation and remove map on destroy', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.data.set(mockHeatmapResponse);
    comp.togglePlay();
    expect(comp.playing()).toBeTrue();
    fixture.destroy();
    expect(mockMap.remove).toHaveBeenCalled();
    expect(comp.playing()).toBeFalse();
  });

  it('should set empty species array on species load error', () => {
    speciesSvc.list.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    expect(comp.species()).toEqual([]);
  });

  it('should set empty zones array on zone load error', () => {
    zoneSvc.list.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    expect(comp.zones()).toEqual([]);
  });

  it('startAnimation should return early when periods length is 1 or less', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set({ periods: [{ label: 'Only', data: [{ lat: -0.22, lng: -78.52, weight: 1 }] }], total: 1 });
    comp['startAnimation']();
    expect(comp.playing()).toBeFalse();
  });

  it('periods getter should return empty array when data is null', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    expect(comp.data()).toBeNull();
    expect(comp.periods).toEqual([]);
  });

  it('currentLabel should return empty string when current period label is null', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set({
      periods: [{ label: null as any, data: [] }],
      total: 0,
    });
    expect(comp.currentLabel).toBe('');
  });

  it('currentPoints should return empty array when current period data is null', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp.data.set({
      periods: [{ label: 'Test', data: null as any }],
      total: 0,
    });
    expect(comp.currentPoints).toEqual([]);
  });

  it('renderPeriod should handle period with null data', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.data.set({
      periods: [{ label: 'Test', data: null as any }],
      total: 0,
    });
    comp['renderPeriod'](0);
    expect(comp.currentPeriod()).toBe(0);
    expect(mockHeatLayer.setLatLngs).toHaveBeenCalledWith([]);
  });

  it('renderPeriod should handle out-of-bounds index', () => {
    const fixture = TestBed.createComponent(HeatmapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.data.set(mockHeatmapResponse);
    comp['renderPeriod'](99);
    expect(comp.currentPeriod()).toBe(99);
    expect(mockHeatLayer.setLatLngs).toHaveBeenCalledWith([]);
  });
});
