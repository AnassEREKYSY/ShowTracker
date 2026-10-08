import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { DurationPipe, ImgPipe } from '../core/format';
import { DiaryItem } from '../core/models';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { RatingComponent } from '../shared/rating.component';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [RouterLink, ImgPipe, DurationPipe, RatingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page max-w-4xl pt-8 sm:pt-10">
      <h1 class="h1">Diary</h1>
      <p class="mt-1 text-ink-muted">Everything you watched, most recent first.</p>

      <div class="mt-8">
        @if (loading()) {
          <div class="space-y-3">@for (i of [1,2,3,4]; track i) { <div class="skeleton h-24"></div> }</div>
        } @else if (!items().length) {
          <app-empty icon="book" title="Your diary is empty" text="Mark a film as watched or tick off an episode and it shows up here.">
            <a routerLink="/discover" class="btn-secondary btn-sm">Find something to watch</a>
          </app-empty>
        } @else {
          @for (m of months(); track m.key) {
            <section class="mb-10">
              <div class="sticky top-16 z-10 -mx-1 mb-3 flex items-baseline justify-between bg-bg/95 px-1 py-2 backdrop-blur">
                <h2 class="text-sm font-semibold">{{ m.label }}</h2>
                <p class="text-[13px] text-ink-faint">{{ m.minutes | duration }} watched</p>
              </div>
              <ol class="divide-y divide-line/[0.06] overflow-hidden rounded-card border border-line/[0.08]">
                @for (it of m.items; track it.kind + it.tmdbId + it.at) {
                  <li class="flex gap-4 bg-surface p-3 sm:p-4">
                    <div class="w-10 shrink-0 pt-1 text-center">
                      <p class="text-lg font-semibold leading-none tabular-nums">{{ day(it.at) }}</p>
                      <p class="mt-1 text-2xs uppercase tracking-wide text-ink-faint">{{ weekday(it.at) }}</p>
                    </div>
                    <a [routerLink]="[it.kind === 'movie' ? '/movie' : '/tv', it.tmdbId]" class="w-12 shrink-0 sm:w-14">
                      <div class="poster rounded-md">
                        @if (it.posterPath) { <img [src]="it.posterPath | img: 'w154'" alt="" loading="lazy" class="h-full w-full object-cover" /> }
                      </div>
                    </a>
                    <div class="min-w-0 flex-1">
                      <a [routerLink]="[it.kind === 'movie' ? '/movie' : '/tv', it.tmdbId]" class="font-medium hover:underline hover:decoration-line/30 hover:underline-offset-4">{{ it.title }}</a>
                      @if (it.year) { <span class="ml-1.5 text-sm text-ink-faint">{{ it.year }}</span> }
                      <p class="mt-0.5 text-[13px] text-ink-muted">
                        @if (it.kind === 'episodes') { {{ episodesLabel(it) }} · } @else { Film · }
                        {{ it.minutes | duration }}
                      </p>
                      @if (it.rating) { <app-rating class="mt-2" [value]="it.rating" [readonly]="true" [size]="14" /> }
                      @if (it.notes) { <p class="mt-2 line-clamp-3 text-sm text-ink/80">“{{ it.notes }}”</p> }
                    </div>
                  </li>
                }
              </ol>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class DiaryPage {
  private api = inject(Api);
  items = signal<DiaryItem[]>([]);
  loading = signal(true);

  months = computed(() => {
    const groups = new Map<string, { key: string; label: string; minutes: number; items: DiaryItem[] }>();
    for (const it of this.items()) {
      const d = new Date(it.at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const g = groups.get(key) ?? { key, label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), minutes: 0, items: [] };
      g.items.push(it); g.minutes += it.minutes;
      groups.set(key, g);
    }
    return [...groups.values()];
  });

  constructor() {
    this.api.diary(200).subscribe({ next: r => { this.items.set(r.items); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  day(iso: string) { return new Date(iso).getDate(); }
  weekday(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' }); }

  /** "S1 · E1–E3" or "3 episodes" across seasons. */
  episodesLabel(it: DiaryItem) {
    const eps = it.episodes ?? [];
    if (eps.length === 1) return `S${eps[0].season} · E${eps[0].episode}`;
    const seasons = new Set(eps.map(e => e.season));
    if (seasons.size === 1) {
      const nums = eps.map(e => e.episode);
      const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
      return contiguous ? `S${eps[0].season} · E${nums[0]}–E${nums.at(-1)}` : `S${eps[0].season} · ${eps.length} episodes`;
    }
    return `${eps.length} episodes`;
  }
}
