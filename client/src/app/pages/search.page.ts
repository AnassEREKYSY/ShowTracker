import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Api } from '../core/api.service';
import { MediaCard } from '../core/models';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { PosterGridComponent } from '../shared/poster-grid.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [PosterGridComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page pt-8 sm:pt-10">
      <p class="eyebrow">Search</p>
      <h1 class="h1 mt-2">{{ query() ? '“' + query() + '”' : 'Search' }}</h1>

      @if (query()) {
        <div class="mt-5 flex gap-2">
          @for (f of filters; track f.v) {
            <button type="button" class="chip" [class.chip-on]="filter() === f.v" (click)="filter.set(f.v)">
              {{ f.label }} <span class="text-ink-faint">{{ count(f.v) }}</span>
            </button>
          }
        </div>
        <div class="mt-6">
          @if (!loading() && !shown().length) {
            <app-empty icon="search" title="No results" text="Check the spelling or try the original title." />
          } @else {
            <app-poster-grid [items]="shown()" [loading]="loading()" />
          }
          @if (page() < totalPages() && results().length) {
            <div class="mt-10 flex justify-center"><button type="button" class="btn-secondary" (click)="more()" [disabled]="loading()">Load more</button></div>
          }
        </div>
      } @else {
        <p class="mt-2 text-ink-muted">Use the search field at the top to find films, series and people.</p>
      }
    </div>
  `,
})
export class SearchPage {
  q = input<string>();
  private api = inject(Api);
  query = computed(() => (this.q() ?? '').trim());
  results = signal<MediaCard[]>([]);
  loading = signal(false);
  page = signal(1);
  totalPages = signal(1);
  filter = signal<'all' | 'movie' | 'tv' | 'person'>('all');
  filters = [
    { v: 'all' as const, label: 'All' }, { v: 'movie' as const, label: 'Films' },
    { v: 'tv' as const, label: 'Series' }, { v: 'person' as const, label: 'People' },
  ];
  shown = computed(() => (this.filter() === 'all' ? this.results() : this.results().filter(r => r.type === this.filter())));

  constructor() {
    effect(() => {
      const q = this.query();
      untracked(() => { this.results.set([]); this.filter.set('all'); if (q) this.fetch(q, 1); });
    });
  }

  count(v: string) { return v === 'all' ? this.results().length : this.results().filter(r => r.type === v).length; }

  private fetch(q: string, page: number) {
    this.loading.set(true);
    this.api.search(q, page).subscribe({
      next: r => { this.results.update(l => (page === 1 ? r.results : [...l, ...r.results])); this.page.set(r.page); this.totalPages.set(r.totalPages); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  more() { this.fetch(this.query(), this.page() + 1); }
}
