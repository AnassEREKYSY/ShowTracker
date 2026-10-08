import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../core/api.service';
import { Genre, MediaCard, MediaKind } from '../core/models';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { PosterGridComponent } from '../shared/poster-grid.component';

const YEARS = Array.from({ length: 2026 - 1960 + 1 }, (_, i) => String(2026 - i));

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [FormsModule, PosterGridComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page pt-8 sm:pt-10">
      <h1 class="h1">Discover</h1>
      <p class="mt-1 text-ink-muted">Browse by genre, year and rating.</p>

      <div class="mt-6 flex flex-col gap-4 border-b border-line/[0.08] pb-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex rounded-lg border border-line/[0.12] bg-surface p-1" role="tablist" aria-label="Type">
            @for (t of types; track t.v) {
              <button type="button" role="tab" class="h-8 rounded-md px-4 text-[13px] font-medium transition-colors"
                      [class]="kind() === t.v ? 'bg-raised text-ink' : 'text-ink-muted hover:text-ink'" [attr.aria-selected]="kind() === t.v"
                      (click)="set({ type: t.v, genre: null })">{{ t.label }}</button>
            }
          </div>
          <div class="ml-auto flex flex-wrap gap-2">
            <label class="sr-only" for="sort">Sort</label>
            <select id="sort" class="select h-10 w-40 text-sm" [ngModel]="sortV()" (ngModelChange)="set({ sort: $event })">
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="newest">Newest</option>
            </select>
            <label class="sr-only" for="year">Year</label>
            <select id="year" class="select h-10 w-28 text-sm" [ngModel]="year() ?? ''" (ngModelChange)="set({ year: $event || null })">
              <option value="">Any year</option>
              @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
            </select>
            <label class="sr-only" for="rating">Minimum rating</label>
            <select id="rating" class="select h-10 w-32 text-sm" [ngModel]="minRating() ?? ''" (ngModelChange)="set({ minRating: $event || null })">
              <option value="">Any rating</option>
              @for (r of ratings; track r) { <option [value]="r">{{ r }}+ stars</option> }
            </select>
          </div>
        </div>
        <div class="flex flex-wrap gap-2" aria-label="Genres">
          <button type="button" class="chip" [class.chip-on]="!genre()" (click)="set({ genre: null })">All genres</button>
          @for (g of genreList(); track g.id) {
            <button type="button" class="chip" [class.chip-on]="genre() === '' + g.id" (click)="set({ genre: genre() === '' + g.id ? null : '' + g.id })">{{ g.name }}</button>
          }
        </div>
      </div>

      <div class="mt-6">
        @if (!loading() && !items().length) {
          <app-empty icon="compass" title="Nothing matches these filters" text="Try another year or a lower rating." />
        } @else {
          <app-poster-grid [items]="items()" [loading]="loading()" />
        }
        @if (page() < totalPages() && items().length) {
          <div class="mt-10 flex justify-center">
            <button type="button" class="btn-secondary" (click)="loadMore()" [disabled]="loading()">Load more</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class DiscoverPage {
  // Query params (component input binding)
  type = input<string>();
  genre = input<string | null>();
  year = input<string | null>();
  minRating = input<string | null>();
  sort = input<string>();

  private api = inject(Api);
  private router = inject(Router);
  types: { v: MediaKind; label: string }[] = [{ v: 'movie', label: 'Films' }, { v: 'tv', label: 'Series' }];
  years = YEARS;
  ratings = ['3', '3.5', '4', '4.5'];

  kind = computed<MediaKind>(() => (this.type() === 'tv' ? 'tv' : 'movie'));
  sortV = computed(() => (['popular', 'rating', 'newest'].includes(this.sort() ?? '') ? this.sort()! : 'popular'));
  genres = signal<Record<MediaKind, Genre[]>>({ movie: [], tv: [] });
  genreList = computed(() => this.genres()[this.kind()]);
  items = signal<MediaCard[]>([]);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(false);

  constructor() {
    for (const k of ['movie', 'tv'] as MediaKind[]) {
      this.api.genres(k).subscribe(g => this.genres.update(all => ({ ...all, [k]: g })));
    }
    effect(() => {
      const f = this.filters();
      untracked(() => { this.items.set([]); this.fetch(f, 1); });
    });
  }

  private filters = computed(() => ({
    type: this.kind(),
    genre: this.genre() ?? undefined,
    year: this.year() ?? undefined,
    // UI shows stars (0-5), TMDB uses 0-10.
    minRating: this.minRating() ? String(Number(this.minRating()) * 2) : undefined,
    sort: this.sortV(),
  }));

  private fetch(f: ReturnType<DiscoverPage['filters']>, page: number) {
    this.loading.set(true);
    const { type, ...rest } = f;
    this.api.discover(type, { ...rest, page }).subscribe({
      next: r => {
        this.items.update(list => (page === 1 ? r.results : [...list, ...r.results]));
        this.page.set(r.page); this.totalPages.set(r.totalPages); this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() { this.fetch(this.filters(), this.page() + 1); }

  set(change: Record<string, string | null>) {
    this.router.navigate([], { queryParams: change, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
