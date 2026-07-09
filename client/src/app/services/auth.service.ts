import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { from, tap, switchMap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { encryptPassword } from '../helpers/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, SignupRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiUrl}/auth`;
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = signal(false);
  readonly ready = signal(false);

  private accessToken: string | null = null;
  private cachedPublicKey: string | null = null;

  initialize() {
    this.fetchPublicKey();
    this.me().subscribe({
      next: () => {
        this.ready.set(true);
        if (this.router.url === '/login') {
          this.router.navigateByUrl('/dashboard');
        }
      },
      error: () => {
        this.clearSession();
        this.ready.set(true);
      },
    });
  }

  private fetchPublicKey() {
    this.http.get<ApiResponse<{ public_key: string }>>(`${this.api}/public-key`).pipe(
      tap((res) => { this.cachedPublicKey = res.data.public_key; }),
    ).subscribe({ error: () => { /* non-critical, will retry on login */ } });
  }

  login(body: LoginRequest) {
    const encryptedPassword$ = this.cachedPublicKey
      ? from(encryptPassword(this.cachedPublicKey, body.password))
      : this.http.get<ApiResponse<{ public_key: string }>>(`${this.api}/public-key`).pipe(
          map((res) => res.data.public_key),
          tap((pk) => { this.cachedPublicKey = pk; }),
          switchMap((pk) => from(encryptPassword(pk, body.password))),
        );

    return encryptedPassword$.pipe(
      switchMap((encryptedPassword) =>
        this.http.post<LoginResponse>(`${this.api}/login`, {
          email: body.email,
          encrypted_password: encryptedPassword,
        }).pipe(
          tap((res) => {
            this.accessToken = res.data.session.access_token;
            this.user.set(res.data.user);
            this.isAuthenticated.set(true);
          }),
        ),
      ),
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
