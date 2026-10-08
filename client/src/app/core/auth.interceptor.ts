import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isAuthCall = /\/auth\/(login|register|refresh)$/.test(req.url);
  const withToken = (token: string | null) =>
    isApi && token && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(withToken(auth.token)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !isApi || isAuthCall || !auth.token) {
        return throwError(() => err);
      }
      return auth.refresh().pipe(
        switchMap(token => (token ? next(withToken(token)) : throwError(() => err))),
      );
    }),
  );
};
