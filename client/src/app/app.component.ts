import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { ToastService } from './core/toast.service';
import { IconComponent } from './shared/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-raised focus:px-3 focus:py-2">Skip to content</a>

    <header class="sticky top-0 z-40 border-b border-line/[0.06] bg-bg/90 backdrop-blur-md">
      <div class="page flex h-16 items-center gap-3 sm:gap-6">
        <a routerLink="/" class="flex shrink-0 items-center gap-2.5" aria-label="ShowTracker home">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#202125"/><rect x="8" y="9" width="16" height="14" rx="2.5" fill="none" stroke="#E8A33D" stroke-width="2.4"/><path d="M14 13.2v5.6l4.8-2.8z" fill="#E8A33D"/></svg>
          <span class="hidden text-[15px] font-semibold tracking-[-0.01em] sm:inline">ShowTracker</span>
        </a>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
          @for (l of links; track l.path) {
            @if (!l.auth || auth.signedIn()) {
              <a [routerLink]="l.path" routerLinkActive="!text-ink bg-raised" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
                 class="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink">{{ l.label }}</a>
            }
          }
        </nav>

        <form class="relative ml-auto w-full max-w-xs" role="search" (ngSubmit)="search()">
          <app-icon name="search" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input name="q" [(ngModel)]="q" type="search" placeholder="Search films, series, people" aria-label="Search"
                 class="h-9 w-full rounded-lg border border-line/[0.1] bg-surface pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-accent/60 focus:outline-none" />
        </form>

        @if (auth.user(); as user) {
          <div class="relative">
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-sm font-semibold text-ink ring-1 ring-line/[0.1] hover:ring-line/25"
                    (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-label="Account menu">
              {{ user.email.charAt(0).toUpperCase() }}
            </button>
            @if (menu()) {
              <div class="absolute right-0 top-11 w-56 rounded-card border border-line/[0.1] bg-raised p-1.5 shadow-2xl shadow-black/40" role="menu">
                <p class="truncate px-2.5 py-2 text-[13px] text-ink-faint">{{ user.email }}</p>
                <a routerLink="/library" (click)="menu.set(false)" class="menu-item" role="menuitem"><app-icon name="library" [size]="16" /> Library</a>
                <a routerLink="/stats" (click)="menu.set(false)" class="menu-item" role="menuitem"><app-icon name="chart" [size]="16" /> Stats</a>
                <div class="my-1 border-t border-line/[0.08]"></div>
                <button type="button" (click)="menu.set(false); auth.logout()" class="menu-item w-full" role="menuitem"><app-icon name="logout" [size]="16" /> Sign out</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/login" class="btn-secondary btn-sm shrink-0">Sign in</a>
        }
      </div>
    </header>

    <main id="main" class="pb-24 md:pb-0">
      <router-outlet />
    </main>

    <footer class="mt-20 hidden border-t border-line/[0.06] md:block">
      <div class="page flex flex-wrap items-center justify-between gap-4 py-8 text-[13px] text-ink-faint">
        <p>ShowTracker. Film and series data from <a class="link" href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>Streaming availability by JustWatch.</p>
      </div>
    </footer>

    <!-- Mobile tab bar -->
    <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.08] bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Main">
      <div class="grid grid-cols-5">
        @for (l of links; track l.path) {
          <a [routerLink]="l.auth && !auth.signedIn() ? '/login' : l.path" routerLinkActive="!text-accent" [routerLinkActiveOptions]="{ exact: l.path === '/' }"
             class="flex flex-col items-center gap-1 py-2.5 text-2xs text-ink-faint">
            <app-icon [name]="l.icon" [size]="20" />{{ l.label }}
          </a>
        }
      </div>
    </nav>

    <div class="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="pointer-events-auto rounded-lg border px-4 py-2.5 text-sm shadow-xl shadow-black/30"
             [class]="t.tone === 'error' ? 'border-danger/40 bg-[#2a1916] text-ink' : 'border-line/[0.12] bg-raised text-ink'">{{ t.text }}</div>
      }
    </div>
  `,
  styles: [`:host ::ng-deep .menu-item { display:flex; align-items:center; gap:.625rem; border-radius:.375rem; padding:.5rem .625rem; font-size:.875rem; color: rgb(var(--ink-muted)); }
            :host ::ng-deep .menu-item:hover { background: rgb(var(--surface)); color: rgb(var(--ink)); }`],
})
export class AppComponent {
  auth = inject(AuthService);
  toast = inject(ToastService);
  private router = inject(Router);
  q = '';
  menu = signal(false);
  links = [
    { path: '/', label: 'Home', icon: 'home', auth: false },
    { path: '/discover', label: 'Discover', icon: 'compass', auth: false },
    { path: '/library', label: 'Library', icon: 'library', auth: true },
    { path: '/diary', label: 'Diary', icon: 'book', auth: true },
    { path: '/stats', label: 'Stats', icon: 'chart', auth: true },
  ];

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menu.set(false));
  }

  search() {
    const q = this.q.trim();
    if (q) this.router.navigate(['/search'], { queryParams: { q } });
  }

  @HostListener('document:click', ['$event'])
  outside(e: MouseEvent) {
    if (this.menu() && !(e.target as HTMLElement).closest('[aria-label="Account menu"], [role="menu"]')) this.menu.set(false);
  }
}
