import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const token = auth.getToken();
  const authedReq = token ? addAuthHeader(req, token) : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        }

        return auth.refresh().pipe(
          switchMap(() => {
            const newToken = auth.getToken();
            const retryReq = newToken ? addAuthHeader(req.clone(), newToken) : req;
            return next(retryReq);
          }),
          catchError(() => {
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      }

      if (err.status === 403) {
        router.navigate(['/dashboard']);
      }

      return throwError(() => err);
    }),
  );
};
