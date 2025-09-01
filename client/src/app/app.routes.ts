import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'auth/login',    canMatch: [guestGuard], loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', canMatch: [guestGuard], loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },

  { path: '**', redirectTo: 'auth/login' }
];
