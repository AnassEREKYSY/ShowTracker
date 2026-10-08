import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User { id: string; email: string; }
const KEY = 'st_access_token';

/** Access token in memory + localStorage, refresh token in an httpOnly cookie set by the API. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiBaseUrl}/auth`;

  readonly user = signal<User | null>(null);
  readonly signedIn = computed(() => !!this.user());
  private _token: string | null = read();
  private refreshing$: Observable<string | null> | null = null;

  get token() { return this._token; }

  /** Called once at startup. */
  restore(): Observable<void> {
    if (!this._token) return of(void 0);
    return this.http.get<{ user: User }>(`${this.base}/me`).pipe(
      tap(r => this.user.set({ id: r.user.id, email: r.user.email })),
      map(() => void 0),
      catchError(() => { this.clear(); return of(void 0); }),
    );
  }

  login(email: string, password: string) {
    return this.http.post<{ user: User; accessToken: string }>(`${this.base}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(r => this.setSession(r.user, r.accessToken)));
  }

  register(email: string, password: string) {
    return this.http.post<{ user: User; accessToken: string }>(`${this.base}/register`, { email, password }, { withCredentials: true })
      .pipe(tap(r => this.setSession(r.user, r.accessToken)));
  }

  /** Single in-flight refresh shared by concurrent 401s. Emits the new token or null. */
  refresh(): Observable<string | null> {
    if (!this.refreshing$) {
      this.refreshing$ = this.http.post<{ accessToken: string }>(`${this.base}/refresh`, {}, { withCredentials: true }).pipe(
        map(r => { this.setToken(r.accessToken); return r.accessToken; }),
        catchError(() => { this.clear(); return of(null); }),
        finalize(() => (this.refreshing$ = null)),
        shareReplay(1),
      );
    }
    return this.refreshing$;
  }

  logout() {
    const done = () => { this.clear(); this.router.navigateByUrl('/'); };
    this.http.post(`${this.base}/logout`, {}, { withCredentials: true }).subscribe({ next: done, error: done });
  }

  private setSession(user: User, token: string) {
    this.setToken(token);
    this.user.set({ id: user.id, email: user.email });
  }
  private setToken(token: string | null) {
    this._token = token;
    try { token ? localStorage.setItem(KEY, token) : localStorage.removeItem(KEY); } catch { /* private mode */ }
  }
  clear() { this.setToken(null); this.user.set(null); }
}

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
