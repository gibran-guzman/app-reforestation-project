import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let httpTesting: HttpTestingController;
  let httpClient: HttpClient;
  let routerSpy: jasmine.SpyObj<Router>;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authMock = jasmine.createSpyObj('AuthService', ['getToken', 'refresh', 'clearSession', 'logout']);
    authMock.getToken.and.returnValue(null);
    authMock.refresh.and.returnValue(throwError(() => new Error('No refresh token')));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authMock },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds Authorization header when token exists', () => {
    authMock.getToken.and.returnValue('my-token');

    httpClient.get('/api/test').subscribe();
    const req = httpTesting.expectOne('/api/test');

    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('does not add Authorization header when no token', () => {
    httpClient.get('/api/test').subscribe();
    const req = httpTesting.expectOne('/api/test');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('redirects to /login on 401 error', () => {
    authMock.getToken.and.returnValue('tok');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.refresh).toHaveBeenCalled();
    expect(authMock.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears session on 401 even without prior token', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects to /dashboard on 403 error', () => {
    authMock.getToken.and.returnValue('tok');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('does not redirect on 500 error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('re-throws the error after handling 401', () => {
    authMock.getToken.and.returnValue('tok');
    let capturedError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err) => { capturedError = err; },
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedError).toBeDefined();
    expect(capturedError!.status).toBe(401);
  });

  it('retries original request after successful refresh', () => {
    authMock.getToken.and.returnValues('expired-token', 'new-token');
    authMock.refresh.and.returnValue(of({} as any));

    httpClient.get('/api/test').subscribe();
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.refresh).toHaveBeenCalled();
    const retryReq = httpTesting.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});
  });
});
