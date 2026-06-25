import { inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

function waitForReady(auth: AuthService, injector: Injector) {
  return toObservable(auth.ready, { injector }).pipe(
    filter((ready) => ready),
    take(1),
  );
}

export const loginGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  if (!auth.ready()) {
    return waitForReady(auth, injector).pipe(
      map(() => {
        if (auth.isAuthenticated()) return router.parseUrl('/dashboard');
        return true;
      }),
    );
  }

  if (auth.isAuthenticated()) return router.parseUrl('/dashboard');

  return true;
};

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  if (!auth.ready()) {
    return waitForReady(auth, injector).pipe(
      map(() => {
        if (auth.isAuthenticated()) return true;
        return router.parseUrl('/login');
      }),
    );
  }

  if (auth.isAuthenticated()) return true;

  return router.parseUrl('/login');
};

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()?.role === 'admin') return true;

  return router.parseUrl('/dashboard');
};
