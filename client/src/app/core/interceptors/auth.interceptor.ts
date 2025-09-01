import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/api-layer/token-storage.service';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { AuthStateService } from '../services/client-layer/auth-state.service';

let refreshInProgress = false;
const refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const tokens = inject(TokenStorageService);

  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isAuth = req.url.includes('/api/auth/');
  const token = tokens.token;

  let clone = req;
  if (isApi && !isAuth && token) {
    clone = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(clone).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && isApi && !isAuth) {
        return handle401(clone, next, auth);
      }
      return throwError(() => err);
    })
  );
};

function handle401(req: HttpRequest<any>, next: HttpHandlerFn, auth: AuthStateService): Observable<HttpEvent<any>> {
  if (!refreshInProgress) {
    refreshInProgress = true;

    return auth.refresh$().pipe(
      switchMap(newToken => {
        refreshInProgress = false;
        refreshSubject.next(newToken);
        const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
        return next(retried);
      }),
      catchError(err => {
        refreshInProgress = false;
        refreshSubject.error(err);
        auth.logout$().subscribe({ error: () => {} });
        return throwError(() => err);
      })
    );
  } else {
    return refreshSubject.pipe(
      filter(t => !!t),
      take(1),
      switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
    );
  }
}
