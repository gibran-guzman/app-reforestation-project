import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import L from 'leaflet';
import PlantingForm from './planting-form';
import { PlantingService } from '../../services/planting.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import { ConfigService } from '../../services/config.service';
import { ImageService } from '../../services/image.service';
import { GeolocationService } from '../../services/geolocation.service';
import type { Species, Zone, PlantingSite } from '../../models';

describe('PlantingForm', () => {
  let plantingSvc: jasmine.SpyObj<PlantingService>;
  let speciesSvc: jasmine.SpyObj<SpeciesService>;
  let zoneSvc: jasmine.SpyObj<ZoneService>;
  let connectivitySvc: jasmine.SpyObj<ConnectivityService>;
  let offlineSvc: jasmine.SpyObj<OfflineService>;
  let configSvc: jasmine.SpyObj<ConfigService>;
  let imageSvc: jasmine.SpyObj<ImageService>;
  let geolocationSvc: jasmine.SpyObj<GeolocationService>;

  const mockMap = jasmine.createSpyObj('Map', ['on', 'remove', 'setView', 'invalidateSize', 'addLayer', 'addTo']);
  const mockTileLayer = jasmine.createSpyObj('TileLayer', ['addTo']);
  const mockMarker = jasmine.createSpyObj('Marker', ['setLatLng', 'addTo', 'getLatLng', 'on', 'isMarkerStarted']);

  const mockSpecies: Species[] = [{
    id: 1, common_name: 'Quishua', scientific_name: 'Oreocallis sp.',
    description: null, ideal_soil_type: null, recommended_altitude_min: null,
    recommended_altitude_max: null, created_at: '2024-01-01T00:00:00Z',
  }];
  const mockZones: Zone[] = [{
    id: 1, name: 'Zona Alta', description: null,
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  }];
  const mockSoilTextures = [{ value: 'loam', label: 'Franco' }, { value: 'clay', label: 'Arcilloso' }];

  let mapClickHandler: ((e: any) => void) | undefined;
  let markerDragHandler: (() => void) | undefined;
  let mockOnline: ReturnType<typeof signal>;

  function createComponent() {
    const fixture = TestBed.createComponent(PlantingForm);
    const comp = fixture.componentInstance;
    (comp as any).mapContainer = signal(new ElementRef(document.createElement('div')));
    (comp as any).photoInput = signal(new ElementRef(document.createElement('input')));
    return { fixture, comp };
  }

  beforeEach(async () => {
    mapClickHandler = undefined;
    markerDragHandler = undefined;
    mockOnline = signal(true);

    mockTileLayer.addTo.and.returnValue(mockMap);
    mockMarker.addTo.and.returnValue(mockMarker);
    mockMarker.getLatLng.and.returnValue({ lat: -0.229, lng: -78.524 });
    mockMarker.on.and.callFake((event: string, handler: any) => {
      if (event === 'dragend') markerDragHandler = handler;
    });
    mockMap.on.and.callFake((event: string, handler: any) => {
      if (event === 'click') mapClickHandler = handler;
    });

    spyOn(L, 'map').and.returnValue(mockMap as any);
    spyOn(L, 'tileLayer').and.returnValue(mockTileLayer as any);
    spyOn(L, 'marker').and.returnValue(mockMarker as any);

    const pSvc = jasmine.createSpyObj('PlantingService', ['create', 'uploadPhoto']);
    const sSvc = jasmine.createSpyObj('SpeciesService', ['list']);
    const zSvc = jasmine.createSpyObj('ZoneService', ['list']);
    const cSvc = jasmine.createSpyObj('ConnectivityService', [], { online: mockOnline as unknown as ReturnType<typeof signal<boolean>> });
    const oSvc = jasmine.createSpyObj('OfflineService', ['getPendingPlantings', 'savePlanting']);
    const cfgSvc = jasmine.createSpyObj('ConfigService', ['getSoilTextures']);
    const iSvc = jasmine.createSpyObj('ImageService', ['validateSize', 'compress', 'readAsDataUrl']);
    const gSvc = jasmine.createSpyObj('GeolocationService', ['isAvailable', 'getCurrentPosition']);

    sSvc.list.and.returnValue(of({ data: mockSpecies }));
    zSvc.list.and.returnValue(of({ data: mockZones }));
    cfgSvc.getSoilTextures.and.returnValue(of({ data: mockSoilTextures }));
    iSvc.validateSize.and.returnValue(null);
    iSvc.compress.and.returnValue(Promise.resolve(new File([''], 'compressed.webp', { type: 'image/webp' })));
    iSvc.readAsDataUrl.and.returnValue(Promise.resolve('data:image/webp;base64,test'));
    gSvc.isAvailable.and.returnValue(true);

    plantingSvc = pSvc;
    speciesSvc = sSvc;
    zoneSvc = zSvc;
    connectivitySvc = cSvc;
    offlineSvc = oSvc;
    configSvc = cfgSvc;
    imageSvc = iSvc;
    geolocationSvc = gSvc;

    await TestBed.configureTestingModule({
      imports: [PlantingForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PlantingService, useValue: plantingSvc },
        { provide: SpeciesService, useValue: speciesSvc },
        { provide: ZoneService, useValue: zoneSvc },
        { provide: ConnectivityService, useValue: connectivitySvc },
        { provide: OfflineService, useValue: offlineSvc },
        { provide: ConfigService, useValue: configSvc },
        { provide: ImageService, useValue: imageSvc },
        { provide: GeolocationService, useValue: geolocationSvc },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    mockMap.on.calls.reset();
    mockMap.setView.calls.reset();
    mockMap.remove.calls.reset();
    mockMarker.setLatLng.calls.reset();
    mockMarker.addTo.calls.reset();
    mockMarker.getLatLng.calls.reset();
    mockMarker.on.calls.reset();
  });

  it('should create', () => {
    const { fixture } = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit should load dropdown data', () => {
    const { comp } = createComponent();
    comp.ngOnInit();
    expect(speciesSvc.list).toHaveBeenCalled();
    expect(zoneSvc.list).toHaveBeenCalled();
    expect(configSvc.getSoilTextures).toHaveBeenCalled();
    expect(comp.speciesList()).toEqual(mockSpecies);
    expect(comp.zonesList()).toEqual(mockZones);
    expect(comp.soilTextures()).toEqual(mockSoilTextures);
  });

  it('should set speciesError on species load failure', () => {
    speciesSvc.list.and.returnValue(throwError(() => ({})));
    const { comp } = createComponent();
    comp.ngOnInit();
    expect(comp.speciesError()).toBe('No se pudieron cargar las especies');
    expect(comp.loadingSpecies()).toBeFalse();
  });

  it('should set zoneError on zone load failure', () => {
    zoneSvc.list.and.returnValue(throwError(() => ({})));
    const { comp } = createComponent();
    comp.ngOnInit();
    expect(comp.zoneError()).toBe('No se pudieron cargar las zonas');
    expect(comp.loadingZones()).toBeFalse();
  });

  it('ngAfterViewInit should initialize Leaflet map', () => {
    const { comp, fixture } = createComponent();
    comp.ngAfterViewInit();
    expect(L.map).toHaveBeenCalled();
    expect(L.tileLayer).toHaveBeenCalled();
    expect(mockMap.on).toHaveBeenCalledWith('click', jasmine.any(Function));
  });

  it('map click should set position', () => {
    const { comp, fixture } = createComponent();
    comp.ngAfterViewInit();
    expect(mapClickHandler).toBeDefined();
    mapClickHandler!({ latlng: { lat: -0.2, lng: -78.5 } });
    expect(comp.form.lat).toBe(-0.2);
    expect(comp.form.lng).toBe(-78.5);
    expect(comp.coordsSet()).toBeTrue();
  });

  it('captureGps should set position on success', fakeAsync(() => {
    geolocationSvc.getCurrentPosition.and.returnValue(Promise.resolve({ lat: -0.2, lng: -78.5 }));
    const { comp, fixture } = createComponent();
    comp.captureGps();
    tick();
    expect(comp.form.lat).toBe(-0.2);
    expect(comp.form.lng).toBe(-78.5);
    expect(comp.gpsStatus()).toBe('Ubicación capturada correctamente');
    expect(comp.gpsFailed()).toBeFalse();
  }));

  it('captureGps should handle failure', fakeAsync(() => {
    geolocationSvc.getCurrentPosition.and.returnValue(Promise.reject(new Error('fail')));
    const { comp, fixture } = createComponent();
    comp.captureGps();
    tick();
    expect(comp.gpsFailed()).toBeTrue();
    expect(comp.gpsStatus()).toContain('No se pudo obtener la ubicación');
  }));

  it('captureGps should warn when geolocation unavailable', () => {
    geolocationSvc.isAvailable.and.returnValue(false);
    const { comp, fixture } = createComponent();
    comp.captureGps();
    expect(comp.gpsStatus()).toBe('La geolocalización no está disponible en este navegador');
    expect(geolocationSvc.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('latInvalid should return true when out of range', () => {
    const { comp } = createComponent();
    comp.touchedLat.set(true);
    comp.form.lat = 100;
    expect(comp.latInvalid()).toBeTrue();
  });

  it('latInvalid should return false when valid', () => {
    const { comp } = createComponent();
    comp.touchedLat.set(true);
    comp.coordsSet.set(true);
    comp.form.lat = -0.2;
    expect(comp.latInvalid()).toBeFalse();
  });

  it('latInvalid should return true when coords not set and lat is 0', () => {
    const { comp } = createComponent();
    comp.touchedLat.set(true);
    comp.coordsSet.set(false);
    comp.form.lat = 0;
    expect(comp.latInvalid()).toBeTrue();
  });

  it('lngInvalid should return true when out of range', () => {
    const { comp } = createComponent();
    comp.touchedLng.set(true);
    comp.form.lng = 200;
    expect(comp.lngInvalid()).toBeTrue();
  });

  it('lngInvalid should return false when valid', () => {
    const { comp } = createComponent();
    comp.touchedLng.set(true);
    comp.coordsSet.set(true);
    comp.form.lng = -78.5;
    expect(comp.lngInvalid()).toBeFalse();
  });

  it('onFileSelected should compress image', fakeAsync(async () => {
    const { comp } = createComponent();
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as Event;
    await comp.onFileSelected(event);
    tick();
    expect(imageSvc.validateSize).toHaveBeenCalledWith(file);
    expect(imageSvc.compress).toHaveBeenCalledWith(file);
    expect(imageSvc.readAsDataUrl).toHaveBeenCalled();
    expect(comp.photoPreview()).toBe('data:image/webp;base64,test');
    expect(comp.compressing()).toBeFalse();
  }));

  it('onFileSelected should set error on validation failure', async () => {
    imageSvc.validateSize.and.returnValue('La foto no puede superar los 5 MB');
    const { comp } = createComponent();
    const file = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as Event;
    await comp.onFileSelected(event);
    expect(comp.error()).toBe('La foto no puede superar los 5 MB');
    expect(imageSvc.compress).not.toHaveBeenCalled();
  });

  it('removePhoto should clear photo state', () => {
    const { comp } = createComponent();
    comp.photoPreview.set('data:image/png;base64,x');
    comp.photoFile.set(new File([''], 'test.png'));
    comp.removePhoto();
    expect(comp.photoPreview()).toBeNull();
    expect(comp.photoFile()).toBeNull();
  });

  it('updateMarkerFromCoords should place marker at current coords', () => {
    const { comp } = createComponent();
    comp.ngAfterViewInit();
    comp.form.lat = -0.229;
    comp.form.lng = -78.524;
    comp.updateMarkerFromCoords();
    expect(comp.coordsSet()).toBeTrue();
    expect(L.marker).toHaveBeenCalledWith([-0.229, -78.524], jasmine.any(Object));
    expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('updateMarkerFromCoords should do nothing with NaN coords', () => {
    const { comp } = createComponent();
    comp.form.lat = NaN;
    comp.form.lng = NaN;
    comp.updateMarkerFromCoords();
    expect(mockMarker.setLatLng).not.toHaveBeenCalled();
  });

  it('marker drag should update coordinates', () => {
    const { comp } = createComponent();
    comp.ngAfterViewInit();
    mapClickHandler!({ latlng: { lat: -0.22, lng: -78.5 } });
    expect(markerDragHandler).toBeDefined();
    mockMarker.getLatLng.and.returnValue({ lat: -0.2, lng: -78.5 });
    markerDragHandler!();
    expect(comp.form.lat).toBe(-0.2);
    expect(comp.form.lng).toBe(-78.5);
  });

  it('submit should call plantingService.create when online', () => {
    plantingSvc.create.and.returnValue(of({ data: { id: 1, zone_id: 1, species_id: 1, location: { type: 'Point', coordinates: [-78.5, -0.2] }, planted_at: '2024-01-01T00:00:00Z', planted_by: null, initial_ph: null, initial_humidity: null, initial_soil_texture: null, photo_url: null, created_at: '2024-01-01T00:00:00Z' } }));
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.submit();
    expect(plantingSvc.create).toHaveBeenCalledWith(jasmine.objectContaining({
      species_id: 1, zone_id: 1, location: { lat: -0.2, lng: -78.5 },
    }));
  });

  it('submit should save offline when offline', () => {
    mockOnline.set(false);
    offlineSvc.savePlanting.and.returnValue(Promise.resolve());
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.submit();
    expect(offlineSvc.savePlanting).toHaveBeenCalled();
  });

  it('submit should set error on create failure', () => {
    plantingSvc.create.and.returnValue(throwError(() => ({ error: { error: 'Error del servidor' } })));
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.submit();
    expect(comp.error()).toBe('Error del servidor');
    expect(comp.saving()).toBeFalse();
  });

  it('touchLat and touchLng should mark fields as touched', () => {
    const { comp } = createComponent();
    expect(comp.touchedLat()).toBeFalse();
    comp.touchLat();
    expect(comp.touchedLat()).toBeTrue();
    expect(comp.touchedLng()).toBeFalse();
    comp.touchLng();
    expect(comp.touchedLng()).toBeTrue();
  });

  function mockCreateResponse(overrides: Partial<PlantingSite> = {}): any {
    return {
      data: {
        id: 42,
        zone_id: 1,
        species_id: 1,
        location: { type: 'Point', coordinates: [-78.5, -0.2] },
        planted_at: '2024-01-01T00:00:00Z',
        planted_by: null,
        initial_ph: null,
        initial_humidity: null,
        initial_soil_texture: null,
        photo_url: null,
        created_at: '2024-01-01T00:00:00Z',
        ...overrides,
      },
    };
  }

  describe('submit with photo', () => {
    it('should upload photo on submit when photoFile exists and id is present', () => {
      plantingSvc.create.and.returnValue(of(mockCreateResponse()));
      plantingSvc.uploadPhoto.and.returnValue(of({ data: { photo_url: 'http://example.com/foto.webp' } }));
      const { comp } = createComponent();
      comp.form.species_id = 1;
      comp.form.zone_id = 1;
      comp.form.lat = -0.2;
      comp.form.lng = -78.5;
      comp.form.initial_survival_status = 'alive';
      comp.photoFile.set(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      comp.submit();
      expect(plantingSvc.uploadPhoto).toHaveBeenCalledWith(42, jasmine.any(File));
    });

    it('should handle upload photo failure via catchError', () => {
      plantingSvc.create.and.returnValue(of(mockCreateResponse()));
      plantingSvc.uploadPhoto.and.returnValue(throwError(() => ({})));
      const { comp } = createComponent();
      comp.form.species_id = 1;
      comp.form.zone_id = 1;
      comp.form.lat = -0.2;
      comp.form.lng = -78.5;
      comp.form.initial_survival_status = 'alive';
      comp.photoFile.set(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      comp.submit();
      expect(plantingSvc.uploadPhoto).toHaveBeenCalled();
    });

    it('should skip upload when response has no id', () => {
      plantingSvc.create.and.returnValue(of(mockCreateResponse({ id: undefined as unknown as number })));
      const { comp } = createComponent();
      comp.form.species_id = 1;
      comp.form.zone_id = 1;
      comp.form.lat = -0.2;
      comp.form.lng = -78.5;
      comp.form.initial_survival_status = 'alive';
      comp.photoFile.set(new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      comp.submit();
      expect(plantingSvc.uploadPhoto).not.toHaveBeenCalled();
    });
  });

  describe('onFileSelected', () => {
    it('should handle compress error', fakeAsync(async () => {
      imageSvc.compress.and.returnValue(Promise.reject(new Error('Compress failed')));
      const { comp } = createComponent();
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } } as unknown as Event;
      await comp.onFileSelected(event);
      tick();
      expect(comp.error()).toBe('Error al procesar la imagen');
      expect(comp.compressing()).toBeFalse();
    }));
  });

  describe('onPhotoZoneKeydown', () => {
    it('should click photo input on Enter key', () => {
      const { comp } = createComponent();
      spyOn(comp.photoInput().nativeElement, 'click');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      comp.onPhotoZoneKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(comp.photoInput().nativeElement.click).toHaveBeenCalled();
    });

    it('should click photo input on Space key', () => {
      const { comp } = createComponent();
      spyOn(comp.photoInput().nativeElement, 'click');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');
      comp.onPhotoZoneKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(comp.photoInput().nativeElement.click).toHaveBeenCalled();
    });

    it('should do nothing for other keys', () => {
      const { comp } = createComponent();
      spyOn(comp.photoInput().nativeElement, 'click');
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      comp.onPhotoZoneKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(comp.photoInput().nativeElement.click).not.toHaveBeenCalled();
    });
  });

  it('submit should show error from details array on failure', () => {
    plantingSvc.create.and.returnValue(throwError(() => ({ error: { details: [{ message: 'Campo requerido' }] } })));
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.submit();
    expect(comp.error()).toBe('Campo requerido');
    expect(comp.saving()).toBeFalse();
  });

  it('submit should handle planted_at being empty', () => {
    plantingSvc.create.and.returnValue(of(mockCreateResponse()));
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.form.planted_at = '';
    comp.submit();
    expect(plantingSvc.create).toHaveBeenCalled();
  });

  it('onFileSelected should do nothing when no file selected', async () => {
    const { comp } = createComponent();
    const event = { target: { files: null } } as unknown as Event;
    await comp.onFileSelected(event);
    expect(imageSvc.validateSize).not.toHaveBeenCalled();
  });

  it('should set loadingTextures false on texture load error', () => {
    configSvc.getSoilTextures.and.returnValue(throwError(() => ({})));
    const { comp } = createComponent();
    comp.ngOnInit();
    expect(comp.loadingTextures()).toBeFalse();
  });

  it('lngInvalid should return true when coords not set and lng is 0', () => {
    const { comp } = createComponent();
    comp.touchedLng.set(true);
    comp.coordsSet.set(false);
    comp.form.lng = 0;
    expect(comp.lngInvalid()).toBeTrue();
  });

  it('should call marker.setLatLng when marker already exists', () => {
    const { comp } = createComponent();
    comp.ngAfterViewInit();
    comp.form.lat = -0.22;
    comp.form.lng = -78.5;
    comp.updateMarkerFromCoords();
    comp.form.lat = -0.23;
    comp.form.lng = -78.51;
    comp.updateMarkerFromCoords();
    expect(mockMarker.setLatLng).toHaveBeenCalledWith([-0.23, -78.51]);
  });

  it('submit should use fallback error message for unknown error shape', () => {
    plantingSvc.create.and.returnValue(throwError(() => ({})));
    const { comp } = createComponent();
    comp.form.species_id = 1;
    comp.form.zone_id = 1;
    comp.form.lat = -0.2;
    comp.form.lng = -78.5;
    comp.form.initial_survival_status = 'alive';
    comp.submit();
    expect(comp.error()).toBe('Error al registrar plántula');
    expect(comp.saving()).toBeFalse();
  });
});
