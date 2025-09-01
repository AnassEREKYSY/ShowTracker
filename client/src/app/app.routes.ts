import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'auth/login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: '**', redirectTo: 'auth/login' }
];
