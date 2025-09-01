import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthState, AuthUser } from '../models/auth.model';
import { LoginRequestDto, RegisterRequestDto } from '../dtos/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private _state$ = new BehaviorSubject<AuthState>({
    user: null, accessToken: this.tokens.token, isAuthenticated: !!this.tokens.token
  });
  state$ = this._state$.asObservable();

  constructor(private api: AuthService, private tokens: TokenStorageService) {}

  get accessToken(): string | null { return this.tokens.token; }
  get user(): AuthUser | null { return this._state$.value.user; }

  register$(dto: RegisterRequestDto) {
    return this.api.register$(dto).pipe(
      tap(res => {
        this.tokens.set(res.accessToken);
        this._state$.next({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
      })
    );
  }

  login$(dto: LoginRequestDto) {
    return this.api.login$(dto).pipe(
      tap(res => {
        this.tokens.set(res.accessToken);
        this._state$.next({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
      })
    );
  }

  refresh$(): Observable<string> {
    return this.api.refresh$().pipe(
      tap(res => {
        this.tokens.set(res.accessToken);
        this._state$.next({ ...this._state$.value, accessToken: res.accessToken, isAuthenticated: true });
      }),
      map(r => r.accessToken)
    );
  }

  logout$(allDevices = false) {
    return this.api.logout$(allDevices).pipe(
      tap(() => {
        this.tokens.clear();
        this._state$.next({ user: null, accessToken: null, isAuthenticated: false });
      })
    );
  }

  setUserFromMe$(fallback = false) {
    return this.api.me$().pipe(
      tap(res => this._state$.next({ ...this._state$.value, user: res.user, isAuthenticated: !!this.tokens.token })),
    );
  }
}
