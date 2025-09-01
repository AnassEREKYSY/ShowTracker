import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const KEY = 'access_token';

@Injectable({ providedIn: 'root' })

export class TokenStorageService {
  private _token$ = new BehaviorSubject<string | null>(this.read());
  token$ = this._token$.asObservable();

  get token(): string | null { return this._token$.value; }

  set(token: string | null, persist = true) {
    if (persist) {
      if (token) localStorage.setItem(KEY, token);
      else localStorage.removeItem(KEY);
    }
    this._token$.next(token);
  }

  clear() { this.set(null, true); }

  private read(): string | null {
    try { return localStorage.getItem(KEY); } catch { return null; }
  }
}
