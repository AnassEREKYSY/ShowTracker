import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  { path: '', title: 'ShowTracker', loadComponent: () => import('./pages/home.page').then(m => m.HomePage) },
  { path: 'discover', title: 'Discover · ShowTracker', loadComponent: () => import('./pages/discover.page').then(m => m.DiscoverPage) },
  { path: 'search', title: 'Search · ShowTracker', loadComponent: () => import('./pages/search.page').then(m => m.SearchPage) },
  { path: 'movie/:id', data: { type: 'movie' }, loadComponent: () => import('./pages/details.page').then(m => m.DetailsPage) },
  { path: 'tv/:id', data: { type: 'tv' }, loadComponent: () => import('./pages/details.page').then(m => m.DetailsPage) },
  { path: 'person/:id', loadComponent: () => import('./pages/person.page').then(m => m.PersonPage) },
  { path: 'library', title: 'Library · ShowTracker', canActivate: [authGuard], loadComponent: () => import('./pages/library.page').then(m => m.LibraryPage) },
  { path: 'diary', title: 'Diary · ShowTracker', canActivate: [authGuard], loadComponent: () => import('./pages/diary.page').then(m => m.DiaryPage) },
  { path: 'stats', title: 'Stats · ShowTracker', canActivate: [authGuard], loadComponent: () => import('./pages/stats.page').then(m => m.StatsPage) },
  { path: 'login', title: 'Sign in · ShowTracker', canActivate: [guestGuard], data: { mode: 'login' }, loadComponent: () => import('./pages/auth.page').then(m => m.AuthPage) },
  { path: 'register', title: 'Create account · ShowTracker', canActivate: [guestGuard], data: { mode: 'register' }, loadComponent: () => import('./pages/auth.page').then(m => m.AuthPage) },
  // Old URLs
  { path: 'auth/login', redirectTo: 'login' },
  { path: 'auth/register', redirectTo: 'register' },
  { path: 'home', redirectTo: '' },
  { path: 'movies/:id', redirectTo: 'movie/:id' },
  { path: 'watchlist/movies', redirectTo: 'library' },
  { path: 'favorites/movies', redirectTo: 'library' },
  { path: '**', title: 'Not found · ShowTracker', loadComponent: () => import('./pages/not-found.page').then(m => m.NotFoundPage) },
];
