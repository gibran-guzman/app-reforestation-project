import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { ApiResponse, LoginRequest, LoginResponse, SignupRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = '/api/auth';
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = signal(false);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.isAuthenticated.set(true);
      this.me().subscribe({
        error: () => {
          this.isAuthenticated.set(false);
          this.user.set(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        },
      });
    }
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.api}/login`, body).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.data.session.access_token);
        localStorage.setItem('refresh_token', res.data.session.refresh_token);
        this.user.set(res.data.user);
        this.isAuthenticated.set(true);
      }),
    );
  }

  signup(body: SignupRequest) {
    return this.http.post<ApiResponse<User>>(`${this.api}/signup`, body);
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.user.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
