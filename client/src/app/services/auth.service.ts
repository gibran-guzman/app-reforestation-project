import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiResponse, LoginRequest, LoginResponse, SignupRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/auth`;
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = signal(false);

  private accessToken: string | null = null;

  constructor() {
    // Session will be restored via initialize() → me() call
    // which relies on HttpOnly cookies set by the server
  }

  initialize() {
    this.me().subscribe({
      error: () => this.clearSession(),
    });
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.api}/login`, body).pipe(
      tap((res) => {
        this.accessToken = res.data.session.access_token;
        this.user.set(res.data.user);
        this.isAuthenticated.set(true);
      }),
    );
  }

  signup(body: SignupRequest) {
    return this.http.post<ApiResponse<User>>(`${this.api}/signup`, body);
  }

  refresh() {
    return this.http.post<LoginResponse>(`${this.api}/refresh`, {}).pipe(
      tap((res) => {
        this.accessToken = res.data.session.access_token;
      }),
    );
  }

  me() {
    return this.http.get<ApiResponse<User & { access_token: string }>>(`${this.api}/me`).pipe(
      tap((res) => {
        this.accessToken = res.data.access_token;
        const { access_token, ...user } = res.data;
        this.user.set(user as User);
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout() {
    this.clearSession();
    this.http.post(`${this.api}/logout`, {}).subscribe({
      error: () => { /* best-effort server-side cookie cleanup */ },
    });
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearSession() {
    this.accessToken = null;
    this.user.set(null);
    this.isAuthenticated.set(false);
  }
}
