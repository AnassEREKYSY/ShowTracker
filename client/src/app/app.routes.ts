import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'auth/login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'favorites/movies', canActivate: [authGuard], loadComponent: () => import('../app/components/favorites-movies/favorites-movies.component').then(m => m.FavoritesMoviesComponent),},
  { path: 'trend', canActivate: [authGuard], loadComponent: () => import('./components/trending/trending.component').then(m => m.TrendingComponent)},

];

