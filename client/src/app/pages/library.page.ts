import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api.service';
import { Favorite, LibraryEntry, MediaKind, Status } from '../core/models';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { PosterCardComponent } from '../shared/poster-card.component';

type Tab = Status | 'favorites';
const TABS: { v: Tab; label: string; empty: string }[] = [
  { v: 'watching', label: 'Watching', empty: 'Series you are in the middle of show up here.' },
  { v: 'planned', label: 'Watchlist', empty: 'Add films and series you want to watch later.' },
  { v: 'watched', label: 'Watched', empty: 'Everything you have finished, with your ratings.' },
  { v: 'dropped', label: 'Dropped', empty: 'Titles you gave up on.' },
  { v: 'favorites', label: 'Favourites', empty: 'Tap the heart on a title to keep it here.' },
];

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [FormsModule, RouterLink, PosterCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page pt-8 sm:pt-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="h1">Library</h1>
          <p class="mt-1 text-ink-muted">{{ all().length }} titles · {{ count('watched') }} watched</p>
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-4 border-b border-line/[0.08] sm:flex-row sm:items-end sm:justify-between">
        <nav class="-mb-px flex gap-1 overflow-x-auto" aria-label="Library sections">
          @for (t of tabs; track t.v) {
            <button type="button" class="relative shrink-0 px-3 pb-3 pt-1 text-sm transition-colors"
                    [class]="tab() === t.v ? 'text-ink' : 'text-ink-muted hover:text-ink'" [attr.aria-current]="tab() === t.v ? 'page' : null"
                    (click)="go(t.v)">
              {{ t.label }} <span class="ml-1 text-ink-faint">{{ t.v === 'favorites' ? favs().length : count(t.v) }}</span>
              @if (tab() === t.v) { <span class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"></span> }
            </button>
          }
        </nav>
        <div class="flex gap-2 pb-3">
          <label class="sr-only" for="kind">Type</label>
          <select id="kind" class="select h-9 w-32 text-sm" [(ngModel)]="kindFilter">
            <option value="all">All types</option><option value="movie">Films</option><option value="tv">Series</option>
          </select>
          @if (tab() !== 'favorites') {
            <label class="sr-only" for="sort">Sort</label>
            <select id="sort" class="select h-9 w-44 text-sm" [(ngModel)]="sortBy">
              <option value="recent">Recently updated</option><option value="title">Title</option><option value="rating">Your rating</option><option value="year">Release year</option>
            </select>
          }
        </div>
      </div>

      <div class="mt-6">
        @if (loading()) {
          <div class="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            @for (i of [1,2,3,4,5,6]; track i) { <div><div class="skeleton aspect-[2/3]"></div><div class="skeleton mt-2 h-3.5 w-3/4"></div></div> }
          </div>
        } @else if (!shown().length) {
          <app-empty [icon]="tab() === 'favorites' ? 'heart' : 'bookmark'" [title]="'Nothing here yet'" [text]="emptyText()">
            <a routerLink="/discover" class="btn-secondary btn-sm">Find something to watch</a>
          </app-empty>
        } @else {
          <div class="grid grid-cols-2 gap-x-3 gap-y-6 min-[480px]:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            @for (c of shown(); track c.type + c.id) {
              <app-poster-card [item]="c" [subtitle]="c.subtitle" [progress]="c.progress" [badge]="c.badge" />
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LibraryPage {
  tabParam = input<string | undefined>(undefined, { alias: 'tab' });
  private api = inject(Api);
  private router = inject(Router);
  tabs = TABS;
  all = signal<LibraryEntry[]>([]);
  favs = signal<Favorite[]>([]);
  loading = signal(true);
  kindFilter = signal<'all' | MediaKind>('all');
  sortBy = signal<'recent' | 'title' | 'rating' | 'year'>('recent');

  tab = computed<Tab>(() => (TABS.some(t => t.v === this.tabParam()) ? (this.tabParam() as Tab) : 'watching'));
  emptyText = computed(() => TABS.find(t => t.v === this.tab())!.empty);

  constructor() {
    forkJoin([this.api.library(), this.api.favorites('movie'), this.api.favorites('tv')]).subscribe({
      next: ([lib, fm, ft]) => {
        this.all.set(lib.items);
        this.favs.set([...fm.items, ...ft.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    // Land on the watchlist when nothing is in progress.
    effect(() => {
      if (!this.loading() && !this.tabParam() && !this.count('watching') && this.count('planned')) {
        untracked(() => this.go('planned'));
      }
    });
  }

  count(s: Status) { return this.all().filter(e => e.status === s).length; }

  shown = computed(() => {
    const kind = this.kindFilter();
    if (this.tab() === 'favorites') {
      return this.favs()
        .filter(f => f.mediaType !== 'person' && (kind === 'all' || f.mediaType === kind))
        .map(f => ({ id: f.tmdbId, type: f.mediaType, title: f.title, posterPath: f.posterPath, year: null, subtitle: f.mediaType === 'tv' ? 'Series' : 'Film', progress: null, badge: null }));
    }
    const list = this.all().filter(e => e.status === this.tab() && (kind === 'all' || e.type === kind));
    const sort = this.sortBy();
    const sorted = [...list].sort((a, b) =>
      sort === 'title' ? (a.title ?? '').localeCompare(b.title ?? '')
      : sort === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0)
      : sort === 'year' ? (b.year ?? 0) - (a.year ?? 0)
      : b.updatedAt.localeCompare(a.updatedAt));
    return sorted.map(e => ({
      id: e.tmdbId, type: e.type, title: e.title, posterPath: e.posterPath, year: e.year,
      subtitle: this.subtitle(e),
      progress: e.type === 'tv' && e.status === 'watching' && e.totalEpisodes ? Math.min(1, (e.watchedEpisodes ?? 0) / e.totalEpisodes) : null,
      badge: e.type === 'tv' && this.tab() !== 'watching' ? 'Series' : null,
    }));
  });

  private subtitle(e: LibraryEntry): string {
    if (e.type === 'tv' && e.status === 'watching') return `${e.watchedEpisodes ?? 0} of ${e.totalEpisodes ?? '?'} episodes`;
    if (e.rating) return `${'★'.repeat(Math.floor(e.rating / 2))}${e.rating % 2 ? '½' : ''}  ${e.year ?? ''}`.trim();
    return e.year ? String(e.year) : e.type === 'tv' ? 'Series' : 'Film';
  }

  go(t: Tab) { this.router.navigate([], { queryParams: { tab: t }, replaceUrl: true }); }
}
