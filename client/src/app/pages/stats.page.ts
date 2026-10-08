import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Stats } from '../core/models';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { IconComponent } from '../shared/icon.component';

/** Clean axis maximum: 1, 2, 2.5, 5 x 10^n above the data max. */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return ([1, 2, 2.5, 5, 10].map(m => m * p).find(x => x >= v) ?? 10 * p);
}
const hours = (min: number) => Math.round((min / 60) * 10) / 10;

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { --chart: #C2802A; --chart-hover: #E8A33D; }`],
  template: `
    <div class="page pt-8 sm:pt-10">
      <h1 class="h1">Stats</h1>
      <p class="mt-1 text-ink-muted">What you watched over the last twelve months.</p>

      @if (s(); as s) {
        @if (!s.totals.minutes && !s.totals.ratedCount) {
          <app-empty class="mt-8" icon="chart" title="No stats yet" text="Mark films as watched and tick off episodes. Your numbers build up from there.">
            <a routerLink="/discover" class="btn-secondary btn-sm">Find something to watch</a>
          </app-empty>
        } @else {
          <!-- Headline numbers -->
          <div class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="card p-5">
              <p class="text-[13px] text-ink-muted">Time watched</p>
              <p class="mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums">{{ totalHours() }}<span class="ml-1 text-lg text-ink-muted">h</span></p>
              <p class="mt-1 text-[13px] text-ink-faint">{{ daysLabel() }}</p>
            </div>
            <div class="card p-5">
              <p class="text-[13px] text-ink-muted">Films watched</p>
              <p class="mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums">{{ s.totals.moviesWatched }}</p>
              <p class="mt-1 text-[13px] text-ink-faint">{{ hoursOf(s.totals.movieMinutes) }} h of film</p>
            </div>
            <div class="card p-5">
              <p class="text-[13px] text-ink-muted">Episodes watched</p>
              <p class="mt-2 text-3xl font-semibold tracking-[-0.02em] tabular-nums">{{ s.totals.episodesWatched }}</p>
              <p class="mt-1 text-[13px] text-ink-faint">{{ s.totals.showsCompleted }} series finished</p>
            </div>
            <div class="card p-5">
              <p class="text-[13px] text-ink-muted">Average rating</p>
              <p class="mt-2 flex items-baseline gap-1.5 text-3xl font-semibold tracking-[-0.02em] tabular-nums">
                {{ s.totals.averageRating ? s.totals.averageRating / 2 : '–' }}<app-icon name="star" [size]="18" [fill]="true" class="text-accent" />
              </p>
              <p class="mt-1 text-[13px] text-ink-faint">{{ s.totals.ratedCount }} titles rated</p>
            </div>
          </div>

          <!-- Hours per month -->
          <section class="card mt-6 p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">Hours watched per month</h2>
                <p class="mt-0.5 text-[13px] text-ink-faint">Films and episodes combined</p>
              </div>
              <button type="button" class="btn-ghost btn-sm" (click)="table.set(!table())" [attr.aria-pressed]="table()">{{ table() ? 'Show chart' : 'Show table' }}</button>
            </div>

            @if (!table()) {
              <div class="relative mt-6 pl-9" role="img" [attr.aria-label]="chartLabel()">
                <!-- grid -->
                <div class="pointer-events-none absolute inset-y-0 left-0 right-0 h-56">
                  @for (t of ticks(); track t) {
                    <div class="absolute left-0 right-0 flex h-0 items-center" [style.bottom.%]="(t / axisMax()) * 100">
                      <span class="w-8 -translate-y-0 pr-2 text-right text-2xs tabular-nums text-ink-faint">{{ t }}</span>
                      <span class="h-px flex-1 bg-line/[0.07]"></span>
                    </div>
                  }
                </div>
                <div class="relative flex h-56 items-end">
                  @for (m of monthBars(); track m.month; let i = $index) {
                    <div class="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none" tabindex="0"
                         (mouseenter)="hover.set(i)" (mouseleave)="hover.set(null)" (focus)="hover.set(i)" (blur)="hover.set(null)">
                      <div class="w-full max-w-[24px] rounded-t transition-colors"
                           [style.height.%]="(m.hours / axisMax()) * 100" [style.min-height.px]="m.hours > 0 ? 2 : 0"
                           [style.background]="hover() === i ? 'var(--chart-hover)' : 'var(--chart)'"></div>
                      @if (m.isMax && hover() === null) {
                        <span class="absolute text-2xs tabular-nums text-ink-muted" [style.bottom]="'calc(' + (m.hours / axisMax()) * 100 + '% + 6px)'">{{ m.hours }}h</span>
                      }
                      @if (hover() === i) {
                        <div class="absolute z-10 w-max rounded-lg border border-line/[0.12] bg-raised px-3 py-2 text-left shadow-xl shadow-black/40"
                             [style.bottom]="'calc(' + (m.hours / axisMax()) * 100 + '% + 10px)'">
                          <p class="text-[13px] font-medium">{{ m.long }}</p>
                          <p class="text-[13px] tabular-nums text-ink-muted">{{ m.hours }} h · {{ m.movies }} film{{ m.movies === 1 ? '' : 's' }} · {{ m.episodes }} ep.</p>
                        </div>
                      }
                    </div>
                  }
                </div>
                <div class="mt-2 flex border-t border-line/[0.12] pt-2">
                  @for (m of monthBars(); track m.month) { <span class="flex-1 text-center text-2xs text-ink-faint">{{ m.short }}</span> }
                </div>
              </div>
            } @else {
              <div class="mt-4 overflow-x-auto">
                <table class="w-full text-sm">
                  <thead><tr class="text-left text-[13px] text-ink-faint"><th class="py-2 font-medium">Month</th><th class="py-2 text-right font-medium">Hours</th><th class="py-2 text-right font-medium">Films</th><th class="py-2 text-right font-medium">Episodes</th></tr></thead>
                  <tbody class="divide-y divide-line/[0.06]">
                    @for (m of monthBars(); track m.month) {
                      <tr><td class="py-2">{{ m.long }}</td><td class="py-2 text-right tabular-nums">{{ m.hours }}</td><td class="py-2 text-right tabular-nums">{{ m.movies }}</td><td class="py-2 text-right tabular-nums">{{ m.episodes }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>

          <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <!-- Genres -->
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Top genres</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">Titles you watched or are watching</p>
              @if (s.topGenres.length) {
                <ul class="mt-5 space-y-3">
                  @for (g of s.topGenres; track g.name) {
                    <li class="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm">
                      <span class="truncate text-ink-muted">{{ g.name }}</span>
                      <span class="flex items-center gap-2">
                        <span class="h-3 rounded-r" [style.width.%]="(g.count / s.topGenres[0].count) * 85" style="background: var(--chart)"></span>
                        <span class="text-[13px] tabular-nums text-ink-muted">{{ g.count }}</span>
                      </span>
                    </li>
                  }
                </ul>
              } @else { <p class="mt-5 text-sm text-ink-muted">Nothing yet.</p> }
            </section>

            <!-- Ratings -->
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">How you rate</h2>
              <p class="mt-0.5 text-[13px] text-ink-faint">Number of titles per rating</p>
              @if (s.totals.ratedCount) {
                <div class="mt-6 flex h-32 items-end gap-1.5" role="img" [attr.aria-label]="ratingLabel()">
                  @for (r of s.ratingDistribution; track r.rating) {
                    <div class="flex h-full flex-1 flex-col items-center justify-end gap-1" [title]="r.rating / 2 + ' stars: ' + r.count">
                      @if (r.count && r.count === maxRating()) { <span class="text-2xs tabular-nums text-ink-muted">{{ r.count }}</span> }
                      <div class="w-full max-w-[24px] rounded-t" [style.height.%]="(r.count / maxRating()) * 80" [style.min-height.px]="r.count ? 2 : 0" style="background: var(--chart)"></div>
                    </div>
                  }
                </div>
                <div class="mt-2 flex gap-1.5 border-t border-line/[0.12] pt-2">
                  @for (r of s.ratingDistribution; track r.rating) { <span class="flex-1 text-center text-2xs tabular-nums text-ink-faint">{{ r.rating % 2 === 0 ? r.rating / 2 : '' }}</span> }
                </div>
                <p class="mt-2 text-right text-2xs text-ink-faint">stars</p>
              } @else { <p class="mt-5 text-sm text-ink-muted">Rate a few titles to see this.</p> }
            </section>

            <!-- Cast -->
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Actors you keep coming back to</h2>
              @if (s.topCast.length) {
                <ol class="mt-4 divide-y divide-line/[0.06]">
                  @for (c of s.topCast; track c.name; let i = $index) {
                    <li class="flex items-center gap-3 py-2.5 text-sm">
                      <span class="w-5 text-[13px] tabular-nums text-ink-faint">{{ i + 1 }}</span>
                      <span class="flex-1 truncate">{{ c.name }}</span>
                      <span class="text-[13px] tabular-nums text-ink-muted">{{ c.count }} title{{ c.count > 1 ? 's' : '' }}</span>
                    </li>
                  }
                </ol>
              } @else { <p class="mt-4 text-sm text-ink-muted">Nothing yet.</p> }
            </section>

            <!-- Library -->
            <section class="card p-5 sm:p-6">
              <h2 class="text-sm font-semibold">Your library</h2>
              <table class="mt-4 w-full text-sm">
                <thead><tr class="text-[13px] text-ink-faint"><th class="py-2 text-left font-medium"></th>
                  @for (c of cols; track c.k) { <th class="py-2 text-right font-medium">{{ c.l }}</th> }</tr></thead>
                <tbody class="divide-y divide-line/[0.06]">
                  @for (r of rows; track r.k) {
                    <tr>
                      <td class="py-2.5 text-ink-muted">{{ r.l }}</td>
                      @for (c of cols; track c.k) {
                        <td class="py-2.5 text-right tabular-nums">
                          <a class="hover:text-accent" [routerLink]="['/library']" [queryParams]="{ tab: c.k }">{{ s.library[r.k][c.k] }}</a>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </section>
          </div>
        }
      } @else if (loading()) {
        <div class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">@for (i of [1,2,3,4]; track i) { <div class="skeleton h-28"></div> }</div>
        <div class="skeleton mt-6 h-72"></div>
      }
    </div>
  `,
})
export class StatsPage {
  private api = inject(Api);
  s = signal<Stats | null>(null);
  loading = signal(true);
  table = signal(false);
  hover = signal<number | null>(null);
  cols = [{ k: 'watching', l: 'Watching' }, { k: 'planned', l: 'Watchlist' }, { k: 'watched', l: 'Watched' }, { k: 'dropped', l: 'Dropped' }] as const;
  rows = [{ k: 'movie', l: 'Films' }, { k: 'tv', l: 'Series' }] as const;

  totalHours = computed(() => Math.round((this.s()?.totals.minutes ?? 0) / 60));
  daysLabel = computed(() => {
    const min = this.s()?.totals.minutes ?? 0;
    const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60);
    return d ? `${d} day${d > 1 ? 's' : ''} ${h} h in total` : `${h} h ${min % 60} min in total`;
  });
  monthBars = computed(() => {
    const months = this.s()?.months ?? [];
    const max = Math.max(0, ...months.map(m => m.minutes));
    return months.map(m => {
      const d = new Date(`${m.month}-01T00:00:00`);
      return {
        ...m,
        hours: hours(m.minutes),
        isMax: max > 0 && m.minutes === max,
        short: d.toLocaleDateString('en-GB', { month: 'narrow' }),
        long: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      };
    });
  });
  axisMax = computed(() => niceMax(Math.max(...this.monthBars().map(m => m.hours), 1)));
  ticks = computed(() => { const m = this.axisMax(); return [0, m / 2, m]; });
  maxRating = computed(() => Math.max(1, ...(this.s()?.ratingDistribution ?? []).map(r => r.count)));
  chartLabel = computed(() => 'Hours watched per month: ' + this.monthBars().map(m => `${m.long} ${m.hours} hours`).join(', '));
  ratingLabel = computed(() => 'Ratings: ' + (this.s()?.ratingDistribution ?? []).map(r => `${r.rating / 2} stars ${r.count}`).join(', '));

  constructor() {
    this.api.stats().subscribe({ next: s => { this.s.set(s); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  hoursOf(min: number) { return Math.round(min / 60); }
}
