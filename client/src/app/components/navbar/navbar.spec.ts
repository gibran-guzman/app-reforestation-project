import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Navbar } from './navbar';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineService } from '../../services/offline.service';
import type { User } from '../../models';

describe('Navbar', () => {
  beforeEach(async () => {
    const user = signal<User | null>({ id: '1', email: 'a@a.com', full_name: 'Admin', role: 'admin' });
    const authMock = jasmine.createSpyObj('AuthService', ['logout', 'getToken'], {
      user,
      isAuthenticated: signal(true),
    });
    const connectivityMock = jasmine.createSpyObj('ConnectivityService', [], {
      online: signal(true),
    });
    const offlineMock = jasmine.createSpyObj('OfflineService', [], {
      pendingCount: signal(0),
    });

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ConnectivityService, useValue: connectivityMock },
        { provide: OfflineService, useValue: offlineMock },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Navbar);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle collapse', () => {
    const fixture = TestBed.createComponent(Navbar);
    const comp = fixture.componentInstance;
    expect(comp.collapsed()).toBeTrue();
    comp.toggleCollapse();
    expect(comp.collapsed()).toBeFalse();
    comp.toggleCollapse();
    expect(comp.collapsed()).toBeTrue();
  });

  it('should toggle dropdown and stop propagation', () => {
    const fixture = TestBed.createComponent(Navbar);
    const comp = fixture.componentInstance;
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    expect(comp.dropdownOpen()).toBeFalse();
    comp.toggleDropdown(event);
    expect(comp.dropdownOpen()).toBeTrue();
    expect(event.stopPropagation).toHaveBeenCalled();
    comp.toggleDropdown(event);
    expect(comp.dropdownOpen()).toBeFalse();
  });

  it('should close dropdown on document click', () => {
    const fixture = TestBed.createComponent(Navbar);
    const comp = fixture.componentInstance;
    comp.dropdownOpen.set(true);
    comp.closeDropdown();
    expect(comp.dropdownOpen()).toBeFalse();
  });
});
