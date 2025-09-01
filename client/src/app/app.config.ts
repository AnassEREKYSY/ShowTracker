import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthStateService } from './core/services/client-layer/auth-state.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

function initAuth() {
  const auth = inject(AuthStateService);
  return () => auth.setUserFromMe$().toPromise().catch(() => {});
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: APP_INITIALIZER, useFactory: initAuth, multi: true }
  ],
};
