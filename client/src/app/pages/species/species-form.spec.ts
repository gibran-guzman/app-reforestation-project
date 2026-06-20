import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import SpeciesForm from './species-form';
import { SpeciesService } from '../../services/species.service';

const mockSpecies = {
  id: 3,
  scientific_name: 'Pinus',
  common_name: 'Pino',
  description: 'Árbol de montaña',
  ideal_soil_type: 'Franco',
  recommended_altitude_min: 1000,
  recommended_altitude_max: 3000,
  created_at: '2024-01-01T00:00:00Z',
};

describe('SpeciesForm', () => {
  let service: jasmine.SpyObj<SpeciesService>;
  let router: Router;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('SpeciesService', ['getById', 'create', 'update']);

    await TestBed.configureTestingModule({
      imports: [SpeciesForm],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: SpeciesService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    service = TestBed.inject(SpeciesService) as jasmine.SpyObj<SpeciesService>;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SpeciesForm);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have initial form fields empty', () => {
    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    expect(comp.form.scientific_name).toBe('');
    expect(comp.form.common_name).toBe('');
    expect(comp.form.description).toBe('');
    expect(comp.form.ideal_soil_type).toBe('');
    expect(comp.form.recommended_altitude_min).toBeNull();
    expect(comp.form.recommended_altitude_max).toBeNull();
    expect(comp.isEdit).toBeFalse();
  });

  it('should load species data in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '5' : null;

    service.getById.and.returnValue(of({ data: { ...mockSpecies, id: 5 } }));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(service.getById).toHaveBeenCalledWith(5);
    expect(comp.isEdit).toBeTrue();
    expect(comp.id).toBe(5);
    expect(comp.form.scientific_name).toBe('Pinus');
    expect(comp.form.common_name).toBe('Pino');
    expect(comp.form.recommended_altitude_min).toBe(1000);
    expect(comp.loading).toBeFalse();
  });

  it('should call service.create and navigate on submit in create mode', () => {
    service.create.and.returnValue(of({ data: { ...mockSpecies, id: 1 } }));
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.form.scientific_name = 'Nueva';
    comp.form.common_name = 'Especie';
    comp.submit();

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({
      scientific_name: 'Nueva',
      common_name: 'Especie',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/species']);
  });

  it('should call service.update and navigate on submit in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '3' : null;

    service.getById.and.returnValue(of({ data: { ...mockSpecies, description: '', ideal_soil_type: '', recommended_altitude_min: null, recommended_altitude_max: null } }));
    service.update.and.returnValue(of({ data: { ...mockSpecies, id: 3 } }));
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    comp.form.scientific_name = 'Updated';
    comp.submit();

    expect(service.update).toHaveBeenCalledWith(3, jasmine.objectContaining({ scientific_name: 'Updated' }));
    expect(router.navigate).toHaveBeenCalledWith(['/species']);
  });

  it('should show error on submit failure', () => {
    service.create.and.returnValue(throwError(() => ({ error: { error: 'Nombre duplicado' } })));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.submit();

    expect(comp.error).toBe('Nombre duplicado');
    expect(comp.saving).toBeFalse();
  });

  it('should show error from details array on submit failure', () => {
    service.create.and.returnValue(throwError(() => ({ error: { details: [{ message: 'Campo requerido' }] } })));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.submit();

    expect(comp.error).toBe('Campo requerido');
  });

  it('should show default error on submit failure when no server fields', () => {
    service.create.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.submit();

    expect(comp.error).toBe('Error al guardar');
    expect(comp.saving).toBeFalse();
  });

  it('should show error on getById failure in edit mode', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '5' : null;

    service.getById.and.returnValue(throwError(() => ({ error: { error: 'No encontrado' } })));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error).toBe('No encontrado');
    expect(comp.loading).toBeFalse();
  });

  it('should show default error on getById failure when no server error', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap as any).get = (key: string) => key === 'id' ? '5' : null;

    service.getById.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(SpeciesForm);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error).toBe('Error al cargar especie');
    expect(comp.loading).toBeFalse();
  });
});
