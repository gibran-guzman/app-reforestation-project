import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let httpTesting: HttpTestingController;

  const mockUser = {
    id: '1',
    email: 'test@test.com',
    full_name: 'Test User',
    role: 'technician' as const,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockLoginResponse = {
    message: 'Login successful',
    data: {
      session: { access_token: 'access-123', refresh_token: 'refresh-123', expires_at: 9999999999 },
      user: mockUser,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    const service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      httpTesting = TestBed.inject(HttpTestingController);
    });

    it('calls me() and sets authenticated when token exists', () => {
      localStorage.setItem('access_token', 'test-token');
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBeTrue();
      const req = httpTesting.expectOne('/api/auth/me');
      req.flush({ data: mockUser });
      expect(service.user()).toEqual(mockUser);
    });

    it('handles me() error and resets state', () => {
      localStorage.setItem('access_token', 'test-token');
      const service = TestBed.inject(AuthService);
      const req = httpTesting.expectOne('/api/auth/me');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('does nothing when no token exists', () => {
      const service = TestBed.inject(AuthService);
      httpTesting.expectNone('/api/auth/me');
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
    });
  });

  describe('login', () => {
    it('sends POST request and stores tokens', () => {
      const service = TestBed.inject(AuthService);
      const body = { email: 'test@test.com', password: 'pwd' };

      service.login(body).subscribe(res => {
        expect(res.data.user).toEqual(mockUser);
      });

      const req = httpTesting.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockLoginResponse);

      expect(localStorage.getItem('access_token')).toBe('access-123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-123');
      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  describe('signup', () => {
    it('sends POST request', () => {
      const service = TestBed.inject(AuthService);
      const body = { email: 'test@test.com', password: 'pwd', full_name: 'Test' };

      service.signup(body).subscribe(res => {
        expect(res.data).toEqual(mockUser);
      });

      const req = httpTesting.expectOne('/api/auth/signup');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ data: mockUser });
    });

    it('handles signup error', () => {
      const service = TestBed.inject(AuthService);
      const body = { email: 'exists@test.com', password: 'pwd', full_name: 'Test' };
      let error: any;

      service.signup(body).subscribe({ error: e => { error = e; } });
      const req = httpTesting.expectOne('/api/auth/signup');
      req.flush({ message: 'Already exists' }, { status: 409, statusText: 'Conflict' });

      expect(error.status).toBe(409);
    });
  });

  describe('me', () => {
    it('sends GET request and sets user', () => {
      const service = TestBed.inject(AuthService);
      service.me().subscribe(res => {
        expect(res.data).toEqual(mockUser);
      });

      const req = httpTesting.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockUser });

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('handles error', () => {
      const service = TestBed.inject(AuthService);
      let error: any;

      service.me().subscribe({ error: e => { error = e; } });
      const req = httpTesting.expectOne('/api/auth/me');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(error.status).toBe(401);
    });
  });

  describe('logout', () => {
    it('clears tokens and resets signals', () => {
      const service = TestBed.inject(AuthService);
      service.user.set(mockUser);
      service.isAuthenticated.set(true);

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      localStorage.setItem('access_token', 'my-token');
      const service = TestBed.inject(AuthService);
      httpTesting.expectOne('/api/auth/me').flush({ data: mockUser });
      expect(service.getToken()).toBe('my-token');
    });

    it('returns null when no token', () => {
      const service = TestBed.inject(AuthService);
      expect(service.getToken()).toBeNull();
    });
  });
});
