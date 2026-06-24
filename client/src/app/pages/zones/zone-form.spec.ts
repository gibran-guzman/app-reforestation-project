import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import ZoneForm from './zone-form';
import { ZoneService } from '../../services/zone.service';

const mockZoneData = {
  data: {
    id: 2,
    name: 'Zona Alta',
    description: 'Zona de montaña',
    geometry: { type: 'Polygon' as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

describe('ZoneForm', () => {
  let service: jasmine.SpyObj<ZoneService>;
  let router: Router;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ZoneService', ['getById', 'create', 'update']);

    await TestBed.configureTestingModule({
      imports: [ZoneForm],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ZoneService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    service = TestBed.inject(ZoneService) as jasmine.SpyObj<ZoneService>;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ZoneForm);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have initial form fields empty', () => {
    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    expect(comp.form.name).toBe('');
    expect(comp.form.description).toBe('');
    expect(comp.isEdit).toBeFalse();
  });

  it('should load zone data in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '2' : null;

    service.getById.and.returnValue(of(mockZoneData));

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(service.getById).toHaveBeenCalledWith(2);
    expect(comp.isEdit).toBeTrue();
    expect(comp.id).toBe(2);
    expect(comp.form.name).toBe('Zona Alta');
    expect(comp.form.description).toBe('Zona de montaña');
    expect(comp.loading()).toBeFalse();
  });

  it('should call service.create and navigate on submit in create mode', () => {
    service.create.and.returnValue(of({ ...mockZoneData, data: { ...mockZoneData.data, id: 1 } }));
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.form.name = 'Nueva Zona';
    comp.submit();

    expect(service.create).toHaveBeenCalledWith({ name: 'Nueva Zona', description: undefined });
    expect(router.navigate).toHaveBeenCalledWith(['/zones']);
  });

  it('should call service.update and navigate on submit in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '2' : null;

    service.getById.and.returnValue(of({ data: { ...mockZoneData.data, name: 'Old', description: '' } }));
    service.update.and.returnValue(of({ data: { ...mockZoneData.data, name: 'Updated' } }));
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    comp.form.name = 'Updated';
    comp.submit();

    expect(service.update).toHaveBeenCalledWith(2, { name: 'Updated', description: undefined });
    expect(router.navigate).toHaveBeenCalledWith(['/zones']);
  });

  it('should show error on submit failure', () => {
    service.create.and.returnValue(throwError(() => ({ error: { error: 'Nombre duplicado' } })));

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.submit();

    expect(comp.error()).toBe('Nombre duplicado');
    expect(comp.saving()).toBeFalse();
  });

  it('should show default error on submit failure when no server fields', () => {
    service.create.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.submit();

    expect(comp.error()).toBe('Error al guardar');
    expect(comp.saving()).toBeFalse();
  });

  it('should show error on getById failure in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '3' : null;

    service.getById.and.returnValue(throwError(() => ({ error: { error: 'No encontrado' } })));

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('No encontrado');
    expect(comp.loading()).toBeFalse();
  });

  it('should show default error on getById failure when no server error', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '3' : null;

    service.getById.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(ZoneForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error al cargar zona');
    expect(comp.loading()).toBeFalse();
  });
});
