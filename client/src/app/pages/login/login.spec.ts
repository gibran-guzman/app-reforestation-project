import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Login from './login';
import { AuthService } from '../../services/auth.service';

describe('Login', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have form fields', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    expect(comp.email).toBe('');
    expect(comp.password).toBe('');
    expect(comp.error).toBe('');
    expect(comp.loading).toBeFalse();
  });

  it('should call auth.login and navigate on success', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    auth.login.and.returnValue(of({
      message: 'ok',
      data: {
        session: { access_token: 't', refresh_token: 'r', expires_at: Date.now() + 3600 },
        user: { id: '1', email: 'a@a.com', full_name: 'A', role: 'admin' },
      },
    }));
    spyOn(router, 'navigate');

    comp.email = 'admin@test.com';
    comp.password = '123456';
    comp.submit();

    expect(auth.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: '123456' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error on failure', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    auth.login.and.returnValue(throwError(() => ({ error: { error: 'Credenciales inválidas' } })));

    comp.submit();

    expect(comp.error).toBe('Credenciales inválidas');
    expect(comp.loading).toBeFalse();
  });

  it('should show default error message when no server error', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    auth.login.and.returnValue(throwError(() => ({})));

    comp.submit();

    expect(comp.error).toBe('Error al iniciar sesión');
  });
});
