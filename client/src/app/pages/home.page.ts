import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ImgPipe, epLabel } from '../core/format';
import { MediaCard, UpNext } from '../core/models';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon.component';
import { MediaRowComponent } from '../shared/media-row.component';
import { PosterItem } from '../shared/poster-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ImgPipe, IconComponent, MediaRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Featured -->
    <section class="page pt-6 sm:pt-8">
      @if (hero(); as h) {
        <div class="relative overflow-hidden rounded-[14px] border border-line/[0.06] bg-surface">
          <img [src]="h.backdropPath | img: 'w1280'" alt="" class="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div class="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/10"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent"></div>
          <div class="relative flex min-h-[340px] max-w-xl flex-col justify-end p-6 sm:min-h-[420px] sm:p-10">
            <p class="eyebrow mb-3 !text-accent">Trending this week</p>
            <h1 class="h1">{{ h.title }}</h1>
            <p class="mt-2 flex items-center gap-3 text-sm text-ink-muted">
              <span>{{ h.type === 'tv' ? 'Series' : 'Film' }}</span>
              @if (h.year) { <span>{{ h.year }}</span> }
              @if (h.rating) { <span class="inline-flex items-center gap-1"><app-icon name="star" [size]="13" [fill]="true" class="text-accent" />{{ h.rating }}</span> }
            </p>
            @if (h.overview) { <p class="mt-3 line-clamp-3 text-[15px] text-ink/80">{{ h.overview }}</p> }
            <div class="mt-6 flex flex-wrap gap-2">
              <a [routerLink]="['/', h.type, h.id]" class="btn-primary">View details</a>
              @if (auth.signedIn()) {
                <button type="button" class="btn-secondary" (click)="addToWatchlist(h)" [disabled]="added().has(h.type + h.id)">
                  <app-icon [name]="added().has(h.type + h.id) ? 'check' : 'plus'" [size]="16" />
                  {{ added().has(h.type + h.id) ? 'On your watchlist' : 'Watchlist' }}
                </button>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="skeleton h-[340px] rounded-[14px] sm:h-[420px]"></div>
      }
    </section>

    @if (!auth.signedIn()) {
      <section class="page mt-6">
        <div class="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div class="grid gap-4 sm:grid-cols-3 sm:gap-8">
            @for (f of pitch; track f.t) {
              <div class="flex gap-3">
                <span class="mt-0.5 text-accent"><app-icon [name]="f.i" [size]="18" /></span>
                <div><p class="text-sm font-medium">{{ f.t }}</p><p class="text-[13px] text-ink-muted">{{ f.d }}</p></div>
              </div>
            }
          </div>
          <a routerLink="/register" class="btn-primary shrink-0">Create a free account</a>
        </div>
      </section>
    }

    <div class="page mt-10 space-y-12">
      @if (upNext().length) {
        <section>
          <div class="mb-3 flex items-end justify-between">
            <div><h2 class="h2">Up next</h2><p class="mt-0.5 text-[13px] text-ink-faint">The next episode of each series you are watching</p></div>
          </div>
          <div class="scroller -mx-4 scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
            @for (u of upNext(); track u.show.tmdbId) {
              <article class="w-[280px] shrink-0 snap-start sm:w-[320px]">
                <a [routerLink]="['/tv', u.show.tmdbId]" class="group relative block aspect-video overflow-hidden rounded-lg bg-raised ring-1 ring-inset ring-line/[0.06]">
                  @if ((u.stillPath || u.show.backdropPath); as still) {
                    <img [src]="still | img: 'w780'" alt="" loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent"></div>
                  <div class="absolute inset-x-3 bottom-3">
                    <p class="text-2xs font-semibold uppercase tracking-[0.1em] text-accent">{{ ep(u.season, u.episode) }}</p>
                    <p class="line-clamp-1 text-sm font-medium">{{ u.name }}</p>
                  </div>
                  @if (u.totalEpisodes) {
                    <div class="absolute inset-x-0 bottom-0 h-1 bg-bg/70"><div class="h-full bg-accent" [style.width.%]="(u.watchedEpisodes / u.totalEpisodes) * 100"></div></div>
                  }
                </a>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <a [routerLink]="['/tv', u.show.tmdbId]" class="line-clamp-1 text-sm text-ink-muted hover:text-ink">{{ u.show.title }}</a>
                  <button type="button" class="btn-ghost btn-sm shrink-0 !px-2" (click)="markWatched(u)" [disabled]="busy().has(u.show.tmdbId)">
                    <app-icon name="check" [size]="15" /> Watched
                  </button>
                </div>
              </article>
            }
          </div>
        </section>
      }

      <app-media-row title="Trending this week" [items]="trending()" [loading]="!trendingLoaded()" moreLink="/discover" />
      @if (watchlist().length) {
        <app-media-row title="On your watchlist" [items]="watchlist()" moreLink="/library" [moreParams]="{ tab: 'planned' }" />
      }
      <app-media-row title="Popular films" [items]="movies()" [loading]="!movies().length" moreLink="/discover" [moreParams]="{ type: 'movie' }" />
      <app-media-row title="Popular series" [items]="shows()" [loading]="!shows().length" moreLink="/discover" [moreParams]="{ type: 'tv' }" />
    </div>
  `,
})
export class HomePage {
  private api = inject(Api);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  trendingAll = signal<MediaCard[]>([]);
  trendingLoaded = signal(false);
  movies = signal<MediaCard[]>([]);
  shows = signal<MediaCard[]>([]);
  upNext = signal<UpNext[]>([]);
  watchlist = signal<PosterItem[]>([]);
  added = signal(new Set<string>());
  busy = signal(new Set<number>());
  hero = computed(() => this.trendingAll().find(t => t.backdropPath) ?? null);
  trending = computed(() => this.trendingAll().filter(t => t !== this.hero()));
  ep = epLabel;

  pitch = [
    { i: 'bookmark', t: 'One watchlist', d: 'Films and series in one place.' },
    { i: 'check-circle', t: 'Episode progress', d: 'Always know what is next.' },
    { i: 'chart', t: 'Your year in stats', d: 'Hours, genres, favourites.' },
  ];

  constructor() {
    this.api.trending('all').pipe(catchError(() => of(null))).subscribe(r => { this.trendingAll.set(r?.results ?? []); this.trendingLoaded.set(true); });
    this.api.popular('movie').pipe(catchError(() => of(null))).subscribe(r => this.movies.set(r?.results ?? []));
    this.api.popular('tv').pipe(catchError(() => of(null))).subscribe(r => this.shows.set(r?.results ?? []));
    if (this.auth.signedIn()) {
      this.loadUpNext();
      this.api.library({ status: 'planned' }).pipe(catchError(() => of({ items: [] }))).subscribe(r =>
        this.watchlist.set(r.items.slice(0, 20).map(e => ({ id: e.tmdbId, type: e.type, title: e.title, year: e.year, posterPath: e.posterPath }))));
    }
  }

  private loadUpNext() {
    this.api.upNext().pipe(catchError(() => of({ items: [] }))).subscribe(r => this.upNext.set(r.items));
  }

  addToWatchlist(m: MediaCard) {
    if (m.type === 'person') return;
    this.api.save(m.type, m.id, { status: 'planned' }).subscribe({
      next: () => { this.added.update(s => new Set(s).add(m.type + m.id)); this.toast.show('Added to your watchlist'); },
      error: () => this.toast.error(),
    });
  }

  markWatched(u: UpNext) {
    this.busy.update(s => new Set(s).add(u.show.tmdbId));
    this.api.setEpisodes(u.show.tmdbId, u.season, [u.episode], true).subscribe({
      next: r => {
        this.toast.show(r.entry?.status === 'watched' ? `Finished ${u.show.title}` : `${epLabel(u.season, u.episode)} watched`);
        this.busy.update(s => { const n = new Set(s); n.delete(u.show.tmdbId); return n; });
        this.loadUpNext();
      },
      error: () => { this.toast.error(); this.busy.update(s => { const n = new Set(s); n.delete(u.show.tmdbId); return n; }); },
    });
  }
}
