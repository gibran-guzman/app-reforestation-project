import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import Register from './register';
import { AuthService } from '../../services/auth.service';

describe('Register', () => {
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['signup']);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Register);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have form fields', () => {
    const fixture = TestBed.createComponent(Register);
    const comp = fixture.componentInstance;
    expect(comp.email()).toBe('');
    expect(comp.password()).toBe('');
    expect(comp.full_name()).toBe('');
    expect(comp.role()).toBe('technician');
    expect(comp.error()).toBe('');
    expect(comp.success()).toBe('');
    expect(comp.loading()).toBeFalse();
  });

  it('should call auth.signup and show success on success', () => {
    const fixture = TestBed.createComponent(Register);
    const comp = fixture.componentInstance;
    auth.signup.and.returnValue(of({ message: 'ok', data: { id: '1', email: 'u@u.com', full_name: 'U', role: 'technician' as const } }));

    comp.email.set('user@test.com');
    comp.password.set('123456');
    comp.full_name.set('Test User');
    comp.role.set('admin');
    comp.submit();

    expect(auth.signup).toHaveBeenCalledWith({ email: 'user@test.com', password: '123456', full_name: 'Test User', role: 'admin' });
    expect(comp.success()).toBe('Usuario creado correctamente.');
    expect(comp.email()).toBe('');
    expect(comp.password()).toBe('');
    expect(comp.full_name()).toBe('');
    expect(comp.role()).toBe('technician');
    expect(comp.loading()).toBeFalse();
  });

  it('should show error on failure', () => {
    const fixture = TestBed.createComponent(Register);
    const comp = fixture.componentInstance;
    auth.signup.and.returnValue(throwError(() => ({ error: { error: 'El usuario ya existe' } })));

    comp.submit();

    expect(comp.error()).toBe('El usuario ya existe');
    expect(comp.loading()).toBeFalse();
  });

  it('should show default error message when no server error', () => {
    const fixture = TestBed.createComponent(Register);
    const comp = fixture.componentInstance;
    auth.signup.and.returnValue(throwError(() => ({})));

    comp.submit();

    expect(comp.error()).toBe('Error al crear usuario');
  });
});
