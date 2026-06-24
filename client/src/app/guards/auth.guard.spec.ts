import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { authGuard, adminGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;
  let authMock: { isAuthenticated: ReturnType<typeof signal<boolean>>; user: ReturnType<typeof signal<any>> };

  beforeEach(() => {
    authMock = {
      isAuthenticated: signal(false),
      user: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock as any },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('returns true when authenticated', () => {
    authMock.isAuthenticated.set(true);
    const result = TestBed.runInInjectionContext(authGuard);
    expect(result).toBeTrue();
  });

  it('returns parseUrl /login when not authenticated', () => {
    const result = TestBed.runInInjectionContext(authGuard) as any;
    expect(result.toString()).toBe('/login');
  });

  it('returns parseUrl /login when isAuthenticated is false', () => {
    authMock.isAuthenticated.set(false);
    const result = TestBed.runInInjectionContext(authGuard) as any;
    expect(result.toString()).toBe('/login');
  });
});

describe('adminGuard', () => {
  let router: Router;
  let authMock: { isAuthenticated: ReturnType<typeof signal<boolean>>; user: ReturnType<typeof signal<any>> };

  beforeEach(() => {
    authMock = {
      isAuthenticated: signal(false),
      user: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock as any },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('returns true when user role is admin', () => {
    authMock.user.set({ role: 'admin' });
    const result = TestBed.runInInjectionContext(adminGuard);
    expect(result).toBeTrue();
  });

  it('returns parseUrl /dashboard when user has no role', () => {
    authMock.user.set({ role: 'technician' });
    const result = TestBed.runInInjectionContext(adminGuard) as any;
    expect(result.toString()).toBe('/dashboard');
  });

  it('returns parseUrl /dashboard when user is null', () => {
    const result = TestBed.runInInjectionContext(adminGuard) as any;
    expect(result.toString()).toBe('/dashboard');
  });
});
