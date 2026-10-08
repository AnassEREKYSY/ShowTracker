import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page flex min-h-[calc(100dvh-4rem)] items-start justify-center pt-12 sm:items-center sm:pt-0">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-semibold tracking-[-0.02em]">{{ isLogin() ? 'Welcome back' : 'Create your account' }}</h1>
        <p class="mt-1.5 text-ink-muted">{{ isLogin() ? 'Sign in to your library, diary and stats.' : 'Track what you watch. Free, no ads.' }}</p>

        <form class="mt-8 space-y-4" (ngSubmit)="submit()" #f="ngForm" novalidate>
          <div>
            <label class="label" for="email">Email</label>
            <input id="email" name="email" type="email" class="input" autocomplete="email" required [(ngModel)]="email" />
          </div>
          <div>
            <div class="flex items-baseline justify-between">
              <label class="label" for="password">Password</label>
              @if (!isLogin()) { <span class="text-2xs text-ink-faint">At least 8 characters</span> }
            </div>
            <input id="password" name="password" type="password" class="input" required minlength="8"
                   [autocomplete]="isLogin() ? 'current-password' : 'new-password'" [(ngModel)]="password" />
          </div>
          @if (error()) { <p class="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-ink" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-primary h-11 w-full" [disabled]="busy()">{{ busy() ? 'Please wait…' : isLogin() ? 'Sign in' : 'Create account' }}</button>
        </form>

        <p class="mt-6 text-center text-sm text-ink-muted">
          @if (isLogin()) { New here? <a routerLink="/register" [queryParams]="next() ? { next: next() } : {}" class="link">Create an account</a> }
          @else { Already have an account? <a routerLink="/login" [queryParams]="next() ? { next: next() } : {}" class="link">Sign in</a> }
        </p>
      </div>
    </div>
  `,
})
export class AuthPage {
  mode = input<'login' | 'register'>('login');
  next = input<string>();
  private auth = inject(AuthService);
  private router = inject(Router);
  isLogin = computed(() => this.mode() === 'login');
  email = '';
  password = '';
  busy = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    const email = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.error.set('Enter a valid email address.');
    if (!this.isLogin() && this.password.length < 8) return this.error.set('Use at least 8 characters for your password.');
    if (!this.password) return this.error.set('Enter your password.');
    this.busy.set(true);
    const call = this.isLogin() ? this.auth.login(email, this.password) : this.auth.register(email, this.password);
    call.subscribe({
      next: () => {
        const next = this.next();
        this.router.navigateByUrl(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(
          e.status === 401 ? 'Email or password is incorrect.'
          : e.status === 409 ? 'An account already exists with this email.'
          : e.status === 400 ? (e.error?.message ?? 'Check the form and try again.')
          : 'Could not reach the server. Try again in a moment.');
      },
    });
  }
}
