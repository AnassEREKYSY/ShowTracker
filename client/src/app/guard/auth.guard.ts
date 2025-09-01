import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthStateService } from '../core/services/client-layer/auth-state.service';


export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.accessToken ? true : router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.accessToken ? router.createUrlTree(['/']) : true;
};
