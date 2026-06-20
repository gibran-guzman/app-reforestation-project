import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpTesting: HttpTestingController;
  let httpClient: HttpClient;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('adds Authorization header when token exists', () => {
    localStorage.setItem('access_token', 'my-token');

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

  it('does not add Authorization header when token is empty string', () => {
    localStorage.setItem('access_token', '');

    httpClient.get('/api/test').subscribe();
    const req = httpTesting.expectOne('/api/test');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('redirects to /login on 401 error', () => {
    localStorage.setItem('access_token', 'tok');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('clears tokens on 401 even without prior token', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not redirect on 403 error', () => {
    localStorage.setItem('access_token', 'tok');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBe('tok');
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
    let capturedError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err) => { capturedError = err; },
    });
    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedError).toBeDefined();
    expect(capturedError!.status).toBe(401);
  });
});
