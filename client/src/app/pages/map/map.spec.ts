import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import L from 'leaflet';
import MapPage from './map';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import type { GeoJsonFeatureCollection } from '../../models';

describe('MapPage', () => {
  let plantingSvc: jasmine.SpyObj<PlantingService>;
  let speciesSvc: jasmine.SpyObj<SpeciesService>;
  let zoneSvc: jasmine.SpyObj<ZoneService>;

  const mockLayerGroup = jasmine.createSpyObj('LayerGroup', ['addTo', 'clearLayers', 'addLayer']);
  const mockCircleMarker = jasmine.createSpyObj('CircleMarker', ['bindPopup', 'addTo']);
  const mockMap = jasmine.createSpyObj('Map', ['on', 'remove', 'setView', 'invalidateSize', 'addLayer', 'addTo']);
  const mockTileLayer = jasmine.createSpyObj('TileLayer', ['addTo']);

  const mockGeoJson: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-78.5, -0.22] },
        properties: {
          planting_id: 1,
          species_name: 'Quishua',
          scientific_name: 'Oreocallis sp.',
          zone_name: 'Zona Alta',
          planted_at: '2024-01-15',
          survival_status: 'alive',
          last_monitoring_date: '2024-06-01',
          initial_ph: 6.5,
          initial_humidity: 60,
          photo_url: null,
        },
      },
    ],
  };

  function configureModule() {
    const pSvc = jasmine.createSpyObj('PlantingService', ['getGeoJson']);
    const sSvc = jasmine.createSpyObj('SpeciesService', ['list']);
    const zSvc = jasmine.createSpyObj('ZoneService', ['list']);

    pSvc.getGeoJson.and.returnValue(of(mockGeoJson));
    sSvc.list.and.returnValue(of({ data: [{ id: 1, common_name: 'Q', scientific_name: 'O' }] }));
    zSvc.list.and.returnValue(of({ data: [{ id: 1, name: 'Z1' }] }));

    return { pSvc, sSvc, zSvc };
  }

  beforeEach(async () => {
    mockTileLayer.addTo.and.returnValue(mockMap);
    mockCircleMarker.bindPopup.and.returnValue(mockCircleMarker);
    mockLayerGroup.addTo.and.returnValue(mockLayerGroup);

    const mocks = configureModule();
    plantingSvc = mocks.pSvc;
    speciesSvc = mocks.sSvc;
    zoneSvc = mocks.zSvc;

    spyOn(L, 'map').and.returnValue(mockMap as any);
    spyOn(L, 'tileLayer').and.returnValue(mockTileLayer as any);
    spyOn(L, 'layerGroup').and.returnValue(mockLayerGroup as any);
    spyOn(L, 'circleMarker').and.returnValue(mockCircleMarker as any);

    await TestBed.configureTestingModule({
      imports: [MapPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PlantingService, useValue: plantingSvc },
        { provide: SpeciesService, useValue: speciesSvc },
        { provide: ZoneService, useValue: zoneSvc },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockLayerGroup.clearLayers.calls.reset();
    mockLayerGroup.addLayer.calls.reset();
    mockCircleMarker.bindPopup.calls.reset();
    mockMap.on.calls.reset();
    mockMap.remove.calls.reset();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MapPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initMap should call L.map with correct params', () => {
    const fixture = TestBed.createComponent(MapPage);
    fixture.componentInstance['initMap']();
    expect(L.map).toHaveBeenCalledWith('map-container', { center: [-0.229, -78.524], zoom: 12 });
  });

  it('initMap should add tile layer and layer group to map', () => {
    const fixture = TestBed.createComponent(MapPage);
    fixture.componentInstance['initMap']();
    expect(L.tileLayer).toHaveBeenCalled();
    expect(L.layerGroup).toHaveBeenCalled();
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
    expect(mockLayerGroup.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('loadGeoJson should render circle markers', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.loadGeoJson();
    expect(L.circleMarker).toHaveBeenCalledWith([-0.22, -78.5], jasmine.any(Object));
    expect(mockCircleMarker.bindPopup).toHaveBeenCalled();
    expect(mockLayerGroup.addLayer).toHaveBeenCalledWith(mockCircleMarker);
    expect(comp.total()).toBe(1);
  });

  it('loadGeoJson should set error on failure', () => {
    plantingSvc.getGeoJson.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp.loadGeoJson();
    expect(comp.error()).toBe('Error de red');
    expect(comp.loading()).toBeFalse();
  });

  it('loadGeoJson should set default error when no server error', () => {
    plantingSvc.getGeoJson.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp.loadGeoJson();
    expect(comp.error()).toBe('Error al cargar los datos del mapa');
    expect(comp.loading()).toBeFalse();
  });

  it('buildFilters should return correct object', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp.filterSpecies.set(1);
    comp.filterZone.set(2);
    comp.filterFrom.set('2024-01-01');
    comp.filterTo.set('2024-12-31');
    const filters = comp['buildFilters']();
    expect(filters).toEqual({ species_id: 1, zone_id: 2, from: '2024-01-01', to: '2024-12-31' });
  });

  it('buildFilters should skip empty filters', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    const filters = comp['buildFilters']();
    expect(filters).toEqual({});
  });

  it('should remove the map on destroy', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    fixture.destroy();
    expect(mockMap.remove).toHaveBeenCalled();
  });

  it('should handle species load error by setting empty array', () => {
    speciesSvc.list.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    expect(comp.species()).toEqual([]);
  });

  it('should handle zone load error by setting empty array', () => {
    zoneSvc.list.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    expect(comp.zones()).toEqual([]);
  });

  it('renderMarkers handles null last_monitoring_date, photo_url, and empty planted_at', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.loadGeoJson();
    mockLayerGroup.clearLayers.calls.reset();
    mockLayerGroup.addLayer.calls.reset();
    mockCircleMarker.bindPopup.calls.reset();

    const geoJson: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-78.5, -0.22] },
        properties: {
          planting_id: 2,
          species_name: 'Test',
          scientific_name: 'Test sp.',
          zone_name: 'Zone',
          planted_at: '',
          survival_status: 'alive',
          last_monitoring_date: null,
          initial_ph: null,
          initial_humidity: null,
          photo_url: null,
        },
      }],
    };

    comp['renderMarkers'](geoJson);
    expect(mockLayerGroup.clearLayers).toHaveBeenCalled();
    expect(L.circleMarker).toHaveBeenCalled();
    expect(mockCircleMarker.bindPopup).toHaveBeenCalled();
  });

  it('renderMarkers falls back to unmonitored color when survival_status is missing', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.loadGeoJson();
    mockLayerGroup.clearLayers.calls.reset();
    mockLayerGroup.addLayer.calls.reset();
    mockCircleMarker.bindPopup.calls.reset();

    const geoJson: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-78.5, -0.22] },
        properties: {
          planting_id: 3,
          species_name: 'Test',
          scientific_name: 'Test sp.',
          zone_name: 'Zone',
          planted_at: '2024-01-15',
          survival_status: 'unknown' as any,
          last_monitoring_date: '2024-06-01',
          initial_ph: null,
          initial_humidity: null,
          photo_url: 'http://example.com/photo.jpg',
        },
      }],
    };

    comp['renderMarkers'](geoJson);
    expect(L.circleMarker).toHaveBeenCalledWith(
      [-0.22, -78.5],
      jasmine.objectContaining({ fillColor: '#adb5bd' }),
    );
    expect(mockCircleMarker.bindPopup).toHaveBeenCalled();
  });

  it('renderMarkers omits img tag when photo_url is null', () => {
    const fixture = TestBed.createComponent(MapPage);
    const comp = fixture.componentInstance;
    comp['initMap']();
    comp.loadGeoJson();
    mockLayerGroup.clearLayers.calls.reset();
    mockLayerGroup.addLayer.calls.reset();
    mockCircleMarker.bindPopup.calls.reset();

    const geoJson: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-78.5, -0.22] },
        properties: {
          planting_id: 4,
          species_name: 'Test',
          scientific_name: 'Test sp.',
          zone_name: 'Zone',
          planted_at: '2024-01-15',
          survival_status: 'alive',
          last_monitoring_date: '2024-06-01',
          initial_ph: null,
          initial_humidity: null,
          photo_url: null,
        },
      }],
    };

    comp['renderMarkers'](geoJson);
    const popupEl = mockCircleMarker.bindPopup.calls.mostRecent().args[0] as HTMLElement;
    expect(popupEl.querySelector('.map-popup-photo')).toBeNull();
    expect(mockCircleMarker.bindPopup).toHaveBeenCalled();
  });
});
