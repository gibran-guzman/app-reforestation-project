import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import SpeciesList from './species-list';
import { SpeciesService } from '../../services/species.service';
import { AuthService } from '../../services/auth.service';

const mockSpecies = {
  id: 1,
  scientific_name: 'Quercus',
  common_name: 'Oak',
  description: null,
  ideal_soil_type: null,
  recommended_altitude_min: null,
  recommended_altitude_max: null,
  created_at: '2024-01-01T00:00:00Z',
};

describe('SpeciesList', () => {
  let service: jasmine.SpyObj<SpeciesService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('SpeciesService', ['list', 'remove']);
    const authMock = jasmine.createSpyObj('AuthService', [], {
      user: { id: '1', email: 'a@a.com', full_name: 'A', role: 'admin' },
    });

    await TestBed.configureTestingModule({
      imports: [SpeciesList],
      providers: [
        provideHttpClient(),
        { provide: SpeciesService, useValue: serviceSpy },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    service = TestBed.inject(SpeciesService) as jasmine.SpyObj<SpeciesService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SpeciesList);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load species on init', () => {
    const mockData = { data: [mockSpecies] };
    service.list.and.returnValue(of(mockData));

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(service.list).toHaveBeenCalled();
    expect(comp.species()).toEqual([mockSpecies] as any);
    expect(comp.loading()).toBeFalse();
  });

  it('should set error on load failure', () => {
    service.list.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error de red');
    expect(comp.loading()).toBeFalse();
  });

  it('deleteSpecies should call service.remove and filter on success', () => {
    service.remove.and.returnValue(of({ message: 'ok' }));
    spyOn(window, 'confirm').and.returnValue(true);

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.species.set([
      { ...mockSpecies, id: 1 },
      { ...mockSpecies, id: 2, scientific_name: 'Pinus' },
    ]);

    comp.deleteSpecies(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(comp.species().length).toBe(1);
    expect(comp.species()[0].id).toBe(2);
  });

  it('deleteSpecies should not call remove when confirm is false', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.deleteSpecies(1);

    expect(service.remove).not.toHaveBeenCalled();
  });

  it('deleteSpecies should alert on remove error', () => {
    service.remove.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.deleteSpecies(1);

    expect(window.alert).toHaveBeenCalledWith('Error de red');
  });

  it('deleteSpecies should alert default message when no server error', () => {
    service.remove.and.returnValue(throwError(() => ({})));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.deleteSpecies(1);

    expect(window.alert).toHaveBeenCalledWith('Error al eliminar');
  });

  it('should set default error on load failure when no server error', () => {
    service.list.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(SpeciesList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error()).toBe('Error al cargar especies');
    expect(comp.loading()).toBeFalse();
  });
});
