import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import ZoneList from './zone-list';
import { ZoneService } from '../../services/zone.service';
import { AuthService } from '../../services/auth.service';

const mockZone = {
  id: 1,
  name: 'Zona Norte',
  description: 'Descripción',
  geometry: { type: 'Polygon' as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ZoneList', () => {
  let service: jasmine.SpyObj<ZoneService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ZoneService', ['list', 'remove']);
    const authMock = jasmine.createSpyObj('AuthService', [], {
      user: { id: '1', email: 'a@a.com', full_name: 'A', role: 'admin' },
    });

    await TestBed.configureTestingModule({
      imports: [ZoneList],
      providers: [
        provideHttpClient(),
        { provide: ZoneService, useValue: serviceSpy },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    service = TestBed.inject(ZoneService) as jasmine.SpyObj<ZoneService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ZoneList);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load zones on init', () => {
    const mockData = { data: [mockZone] };
    service.list.and.returnValue(of(mockData));

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(service.list).toHaveBeenCalled();
    expect(comp.zones).toEqual([mockZone] as any);
    expect(comp.loading).toBeFalse();
  });

  it('should set error on load failure', () => {
    service.list.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error).toBe('Error de red');
    expect(comp.loading).toBeFalse();
  });

  it('deleteZone should call service.remove and filter on success', () => {
    service.remove.and.returnValue(of({ message: 'ok' }));
    spyOn(window, 'confirm').and.returnValue(true);

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.zones = [
      { ...mockZone, id: 1 },
      { ...mockZone, id: 2, name: 'Zona Sur' },
    ];

    comp.deleteZone(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(comp.zones.length).toBe(1);
    expect(comp.zones[0].id).toBe(2);
  });

  it('deleteZone should not call remove when confirm is false', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.deleteZone(1);

    expect(service.remove).not.toHaveBeenCalled();
  });

  it('deleteZone should alert on remove error', () => {
    service.remove.and.returnValue(throwError(() => ({ error: { error: 'Error de red' } })));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.deleteZone(1);

    expect(window.alert).toHaveBeenCalledWith('Error de red');
  });

  it('deleteZone should alert default message when no server error', () => {
    service.remove.and.returnValue(throwError(() => ({})));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.deleteZone(1);

    expect(window.alert).toHaveBeenCalledWith('Error al eliminar');
  });

  it('should set default error on load failure when no server error', () => {
    service.list.and.returnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(ZoneList);
    const comp = fixture.componentInstance;
    comp.ngOnInit();

    expect(comp.error).toBe('Error al cargar zonas');
    expect(comp.loading).toBeFalse();
  });
});
