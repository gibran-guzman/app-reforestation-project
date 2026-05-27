import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.parseUrl('/login');
};

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()?.role === 'admin') return true;

  return router.parseUrl('/dashboard');
};
