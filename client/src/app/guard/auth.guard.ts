import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthStateService } from '../core/services/client-layer/auth-state.service';

export function e2eBypass(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('E2E_DISABLE_AUTH') === '1';
  } catch {
    return false;
  }
}

export const e2eHomeMatch: CanMatchFn = () => e2eBypass();
export const notE2E: CanMatchFn = () => !e2eBypass();

export const authGuard: CanActivateFn = () => {
  if (e2eBypass()) return true;
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.accessToken ? true : router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanMatchFn = () => {
  if (e2eBypass()) return true;
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.accessToken ? router.createUrlTree(['/']) : true;
};
