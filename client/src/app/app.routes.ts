import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login') },
  { path: 'register', canActivate: [authGuard, adminGuard], loadComponent: () => import('./pages/register/register') },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard'),
  },
  {
    path: 'species',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/species/species-list'),
  },
  {
    path: 'species/new',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/species/species-form'),
  },
  {
    path: 'species/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/species/species-form'),
  },
  {
    path: 'zones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/zones/zone-list'),
  },
  {
    path: 'zones/new',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/zones/zone-form'),
  },
  {
    path: 'zones/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/zones/zone-form'),
  },
  {
    path: 'plantings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/plantings/planting-list'),
  },
  {
    path: 'plantings/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/plantings/planting-form'),
  },
  {
    path: 'plantings/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/plantings/planting-detail/planting-detail'),
  },
  {
    path: 'map',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/map/map'),
  },
  {
    path: 'heatmap',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/heatmap/heatmap'),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/reports'),
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
