import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ApiResponse, LoginRequest, LoginResponse, SignupRequest, User } from '../models';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/auth`;
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = signal(false);

  private accessToken: string | null = null;

  constructor() {
    const token = this.readAccessToken();
    if (token) {
      this.accessToken = token;
      this.isAuthenticated.set(true);
    }
  }

  initialize() {
    if (this.accessToken) {
      this.me().subscribe({
        error: () => this.clearSession(),
      });
    }
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.api}/login`, body).pipe(
      tap((res) => {
        this.saveTokens(res.data.session.access_token, res.data.session.refresh_token);
        this.user.set(res.data.user);
        this.isAuthenticated.set(true);
      }),
    );
  }

  signup(body: SignupRequest) {
    return this.http.post<ApiResponse<User>>(`${this.api}/signup`, body);
  }

  refresh() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token available');

    return this.http.post<LoginResponse>(`${this.api}/refresh`, { refresh_token: refreshToken }).pipe(
      tap((res) => {
        this.saveTokens(res.data.session.access_token, res.data.session.refresh_token);
      }),
    );
  }

  me() {
    return this.http.get<ApiResponse<User>>(`${this.api}/me`).pipe(
      tap((res) => {
        this.user.set(res.data);
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout() {
    this.clearSession();
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private saveTokens(access: string, refresh: string) {
    this.accessToken = access;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  private readAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private clearSession() {
    this.accessToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.user.set(null);
    this.isAuthenticated.set(false);
  }
}
