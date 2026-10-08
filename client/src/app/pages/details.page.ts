import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { DurationPipe, ImgPipe, epLabel } from '../core/format';
import { Details, EpisodeRef, LibraryEntry, MediaKind, STATUS_LABEL, Season, Status } from '../core/models';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon.component';
import { MediaRowComponent } from '../shared/media-row.component';
import { RatingComponent } from '../shared/rating.component';
import { TrailerDialogComponent } from '../shared/trailer-dialog.component';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [RouterLink, FormsModule, ImgPipe, DurationPipe, IconComponent, MediaRowComponent, RatingComponent, TrailerDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (d(); as d) {
      <!-- Header -->
      <section class="relative">
        <div class="absolute inset-x-0 top-0 h-[420px] overflow-hidden sm:h-[520px]">
          @if (d.backdropPath) { <img [src]="d.backdropPath | img: 'w1280'" alt="" class="h-full w-full object-cover object-top opacity-40" /> }
          <div class="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/70 to-bg"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent"></div>
        </div>

        <div class="page relative grid gap-6 pt-8 sm:pt-14 md:grid-cols-[240px_1fr] md:gap-10 lg:grid-cols-[280px_1fr]">
          <div class="mx-auto w-40 sm:w-52 md:mx-0 md:w-full">
            <div class="poster shadow-2xl shadow-black/50 ring-1 ring-line/[0.08]">
              @if (d.posterPath) { <img [src]="d.posterPath | img: 'w500'" [alt]="d.title + ' poster'" class="h-full w-full object-cover" /> }
            </div>
          </div>

          <div class="min-w-0">
            <p class="eyebrow">{{ d.type === 'tv' ? 'Series' : 'Film' }}@if (d.networks?.length) { · {{ d.networks![0].name }}}</p>
            <h1 class="h1 mt-2">{{ d.title }}</h1>
            @if (d.originalTitle && d.originalTitle !== d.title) { <p class="mt-1 text-sm text-ink-faint">{{ d.originalTitle }}</p> }

            <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
              @if (d.year) { <span>{{ d.year }}</span> }
              @if (d.certification) { <span class="rounded border border-line/20 px-1.5 text-2xs leading-5">{{ d.certification }}</span> }
              @if (d.type === 'movie' && d.runtime) { <span>{{ d.runtime | duration }}</span> }
              @if (d.type === 'tv' && d.seasons?.length) { <span>{{ d.seasons!.length }} season{{ d.seasons!.length > 1 ? 's' : '' }}</span> }
              @if (d.type === 'tv' && d.status) { <span>{{ d.status === 'Returning Series' ? 'Ongoing' : d.status }}</span> }
              @if (d.rating) {
                <span class="inline-flex items-center gap-1" title="TMDB rating"><app-icon name="star" [size]="14" [fill]="true" class="text-accent" /><span class="text-ink">{{ d.rating }}</span><span class="text-ink-faint">/10 · {{ votes(d.voteCount) }}</span></span>
              }
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              @for (g of d.genres; track g.id) {
                <a [routerLink]="['/discover']" [queryParams]="{ type: d.type, genre: g.id }" class="tag hover:text-ink">{{ g.name }}</a>
              }
            </div>

            @if (d.tagline) { <p class="mt-5 text-[15px] italic text-ink-muted">{{ d.tagline }}</p> }
            @if (d.overview) { <p class="mt-3 max-w-3xl text-[15px] leading-7 text-ink/85">{{ d.overview }}</p> }
            @if (d.directors.length) {
              <p class="mt-4 text-sm text-ink-muted">{{ d.type === 'tv' ? 'Created by' : 'Directed by' }}
                @for (p of d.directors; track p.id; let last = $last) {
                  <a [routerLink]="['/person', p.id]" class="link">{{ p.name }}</a>{{ last ? '' : ', ' }}
                }
              </p>
            }

            <!-- Actions -->
            <div class="mt-7 card p-4 sm:p-5">
              @if (auth.signedIn()) {
                <div class="flex flex-wrap items-center gap-2">
                  <div class="inline-flex rounded-lg border border-line/[0.12] bg-surface p-1" role="group" aria-label="Status">
                    @for (s of mainStatuses; track s) {
                      <button type="button" class="h-8 rounded-md px-3 text-[13px] font-medium transition-colors"
                              [class]="entry()?.status === s ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'"
                              [attr.aria-pressed]="entry()?.status === s" [disabled]="saving()" (click)="setStatus(s)">
                        {{ label[s] }}
                      </button>
                    }
                  </div>
                  <button type="button" class="btn-secondary btn-icon !h-10" [class.!text-accent]="favorite()" (click)="toggleFavorite()"
                          [attr.aria-pressed]="favorite()" [attr.aria-label]="favorite() ? 'Remove from favourites' : 'Add to favourites'" title="Favourite">
                    <app-icon name="heart" [fill]="favorite()" />
                  </button>
                  @if (d.trailer) {
                    <button type="button" class="btn-secondary" (click)="trailer.set(true)"><app-icon name="play" [size]="15" [fill]="true" /> Trailer</button>
                  }
                  @if (entry()) {
                    <div class="relative ml-auto">
                      <button type="button" class="btn-ghost btn-icon" (click)="more.set(!more())" aria-label="More actions"><app-icon name="more" /></button>
                      @if (more()) {
                        <div class="absolute right-0 top-11 z-10 w-48 rounded-card border border-line/[0.1] bg-raised p-1.5 shadow-2xl shadow-black/40">
                          @if (entry()!.status !== 'dropped') {
                            <button type="button" class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-ink-muted hover:bg-surface hover:text-ink" (click)="more.set(false); setStatus('dropped')"><app-icon name="ban" [size]="16" /> Mark as dropped</button>
                          }
                          <button type="button" class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-danger hover:bg-surface" (click)="more.set(false); removeEntry()"><app-icon name="trash" [size]="16" /> Remove from library</button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/[0.08] pt-4">
                  <div class="flex items-center gap-3">
                    <span class="text-[13px] text-ink-faint">Your rating</span>
                    <app-rating [value]="entry()?.rating ?? null" [showValue]="true" (changed)="rate($event)" />
                  </div>
                  @if (entry()?.status === 'dropped') { <span class="tag">Dropped</span> }
                  @if (entry()?.watchedAt && entry()?.status === 'watched') {
                    <span class="text-[13px] text-ink-faint">Watched {{ date(entry()!.watchedAt!) }}</span>
                  }
                  <button type="button" class="btn-ghost btn-sm ml-auto" (click)="editNotes.set(!editNotes())">
                    <app-icon name="pencil" [size]="14" /> {{ entry()?.notes ? 'Edit note' : 'Add a note' }}
                  </button>
                </div>
                @if (entry()?.notes && !editNotes()) {
                  <p class="mt-3 whitespace-pre-line rounded-lg bg-surface px-3.5 py-3 text-sm text-ink/85">{{ entry()!.notes }}</p>
                }
                @if (editNotes()) {
                  <form class="mt-3" (ngSubmit)="saveNotes()">
                    <label class="sr-only" for="notes">Note</label>
                    <textarea id="notes" name="notes" [(ngModel)]="notes" rows="3" maxlength="2000" placeholder="What did you think?"
                              class="input h-auto py-2.5"></textarea>
                    <div class="mt-2 flex justify-end gap-2">
                      <button type="button" class="btn-ghost btn-sm" (click)="editNotes.set(false)">Cancel</button>
                      <button type="submit" class="btn-primary btn-sm" [disabled]="saving()">Save note</button>
                    </div>
                  </form>
                }
              } @else {
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="text-sm text-ink-muted">Sign in to add this to your watchlist, rate it and track your progress.</p>
                  <div class="flex gap-2">
                    @if (d.trailer) { <button type="button" class="btn-secondary" (click)="trailer.set(true)"><app-icon name="play" [size]="15" [fill]="true" /> Trailer</button> }
                    <a routerLink="/login" [queryParams]="{ next: router.url }" class="btn-primary">Sign in</a>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <div class="page mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div class="min-w-0 space-y-12">
          <!-- Episodes -->
          @if (d.type === 'tv' && d.seasons?.length) {
            <section>
              <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 class="h2">Episodes</h2>
                  @if (auth.signedIn() && d.airedEpisodes) {
                    <p class="mt-0.5 text-[13px] text-ink-faint">{{ watchedCount() }} of {{ d.airedEpisodes }} aired episodes watched</p>
                  }
                </div>
                @if (d.nextEpisode) {
                  <p class="text-[13px] text-ink-muted">Next: {{ ep(d.nextEpisode.season, d.nextEpisode.episode) }} on {{ date(d.nextEpisode.airDate) }}</p>
                }
              </div>
              @if (auth.signedIn() && d.airedEpisodes) {
                <div class="mb-5 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" [attr.aria-valuenow]="watchedCount()" aria-valuemin="0" [attr.aria-valuemax]="d.airedEpisodes">
                  <div class="h-full rounded-full bg-accent transition-all" [style.width.%]="(watchedCount() / d.airedEpisodes) * 100"></div>
                </div>
              }
              <div class="scroller mb-4 gap-2">
                @for (s of d.seasons!; track s.number) {
                  <button type="button" class="chip shrink-0" [class.chip-on]="seasonNo() === s.number" (click)="seasonNo.set(s.number)">
                    {{ s.name }}
                    @if (auth.signedIn() && seasonDone(s.number, s.episodeCount)) { <app-icon name="check" [size]="13" /> }
                  </button>
                }
              </div>

              @if (season(); as s) {
                @if (auth.signedIn()) {
                  <div class="mb-2 flex justify-end">
                    @if (seasonDone(s.number, airedIn(s).length) && airedIn(s).length) {
                      <button type="button" class="btn-ghost btn-sm" (click)="toggleSeason(s, false)" [disabled]="saving()">Unmark season</button>
                    } @else if (airedIn(s).length) {
                      <button type="button" class="btn-ghost btn-sm" (click)="toggleSeason(s, true)" [disabled]="saving()"><app-icon name="check" [size]="14" /> Mark season watched</button>
                    }
                  </div>
                }
                <ol class="divide-y divide-line/[0.06] overflow-hidden rounded-card border border-line/[0.08]">
                  @for (e of s.episodes; track e.number) {
                    <li class="flex gap-3 bg-surface p-3 sm:gap-4">
                      <div class="relative hidden aspect-video w-36 shrink-0 overflow-hidden rounded-md bg-raised sm:block">
                        @if (e.stillPath) { <img [src]="e.stillPath | img: 'w342'" alt="" loading="lazy" class="h-full w-full object-cover" /> }
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[13px] text-ink-faint">Episode {{ e.number }}@if (e.airDate) { · {{ date(e.airDate) }}}@if (e.runtime) { · {{ e.runtime | duration }}}</p>
                        <p class="line-clamp-1 font-medium">{{ e.name }}</p>
                        @if (e.overview) { <p class="mt-1 line-clamp-2 text-sm text-ink-muted">{{ e.overview }}</p> }
                      </div>
                      @if (auth.signedIn()) {
                        @if (aired(e.airDate)) {
                          <button type="button" class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
                                  [class]="isWatched(s.number, e.number) ? 'border-accent bg-accent text-accent-ink' : 'border-line/20 text-ink-faint hover:border-line/40 hover:text-ink'"
                                  [attr.aria-pressed]="isWatched(s.number, e.number)"
                                  [attr.aria-label]="(isWatched(s.number, e.number) ? 'Unmark ' : 'Mark watched: ') + ep(s.number, e.number)"
                                  (click)="toggleEpisode(s.number, e.number)">
                            <app-icon name="check" [size]="16" [stroke]="2.25" />
                          </button>
                        } @else {
                          <span class="mt-2 shrink-0 text-2xs uppercase tracking-wider text-ink-faint">Upcoming</span>
                        }
                      }
                    </li>
                  }
                </ol>
              } @else {
                <div class="space-y-2">@for (i of [1, 2, 3]; track i) { <div class="skeleton h-24"></div> }</div>
              }
            </section>
          }

          @if (castItems().length) {
            <app-media-row title="Cast" [items]="castItems()" />
          }
          @if (d.recommendations.length) {
            <app-media-row [title]="d.type === 'tv' ? 'If you like this series' : 'If you like this film'" [items]="d.recommendations" />
          }
        </div>

        <!-- Side -->
        <aside class="space-y-6">
          <section class="card p-5">
            <h2 class="text-sm font-semibold">Where to watch</h2>
            <p class="mt-0.5 text-[13px] text-ink-faint">In {{ regionName(d.providers.region) }}</p>
            @if (!d.providers.stream.length && !d.providers.rent.length && !d.providers.buy.length) {
              <p class="mt-4 text-sm text-ink-muted">Not available to stream right now.</p>
            }
            @for (group of providerGroups(d); track group.label) {
              <div class="mt-4">
                <p class="mb-2 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">{{ group.label }}</p>
                <ul class="flex flex-wrap gap-2">
                  @for (p of group.list; track p.id) {
                    <li>
                      <a [href]="d.providers.link ?? '#'" target="_blank" rel="noopener" [title]="p.name"
                         class="block h-10 w-10 overflow-hidden rounded-lg bg-raised ring-1 ring-line/10 transition hover:ring-line/30">
                        @if (p.logoPath) { <img [src]="p.logoPath | img: 'w92'" [alt]="p.name" class="h-full w-full object-cover" /> }
                        @else { <span class="flex h-full items-center justify-center text-2xs">{{ p.name.slice(0, 2) }}</span> }
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
            @if (d.providers.link) {
              <a [href]="d.providers.link" target="_blank" rel="noopener" class="mt-5 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
                All options on TMDB <app-icon name="external" [size]="13" />
              </a>
            }
            <p class="mt-3 text-2xs text-ink-faint">Availability data by JustWatch.</p>
          </section>

          <section class="card divide-y divide-line/[0.06] text-sm">
            @for (f of facts(d); track f.k) {
              <div class="flex justify-between gap-4 px-5 py-3"><span class="text-ink-faint">{{ f.k }}</span><span class="text-right text-ink/90">{{ f.v }}</span></div>
            }
          </section>
        </aside>
      </div>

      @if (trailer() && d.trailer) {
        <app-trailer-dialog [videoKey]="d.trailer.key" [title]="d.title + ' · ' + d.trailer.name" (closed)="trailer.set(false)" />
      }
    } @else if (error()) {
      <div class="page py-24 text-center">
        <p class="h2">This title could not be found</p>
        <p class="mt-2 text-ink-muted">It may have been removed from TMDB.</p>
        <a routerLink="/discover" class="btn-secondary mt-6">Browse titles</a>
      </div>
    } @else {
      <div class="page pt-14">
        <div class="grid gap-10 md:grid-cols-[280px_1fr]">
          <div class="skeleton aspect-[2/3]"></div>
          <div class="space-y-4"><div class="skeleton h-10 w-2/3"></div><div class="skeleton h-4 w-1/3"></div><div class="skeleton h-24 w-full"></div><div class="skeleton h-28 w-full"></div></div>
        </div>
      </div>
    }
  `,
})
export class DetailsPage {
  // Route params (component input binding)
  id = input.required<string>();
  type = input.required<MediaKind>();

  private api = inject(Api);
  private toast = inject(ToastService);
  private titleSvc = inject(Title);
  router = inject(Router);
  auth = inject(AuthService);

  d = signal<Details | null>(null);
  error = signal(false);
  entry = signal<LibraryEntry | null>(null);
  favorite = signal(false);
  episodes = signal<EpisodeRef[]>([]);
  seasonNo = signal<number | null>(null);
  season = signal<Season | null>(null);
  saving = signal(false);
  trailer = signal(false);
  more = signal(false);
  editNotes = signal(false);
  notes = '';

  label = STATUS_LABEL;
  mainStatuses: Status[] = ['planned', 'watching', 'watched'];
  ep = epLabel;

  watched = computed(() => new Set(this.episodes().map(e => `${e.season}:${e.episode}`)));
  watchedCount = computed(() => this.episodes().length);
  castItems = computed(() => (this.d()?.cast ?? []).map(c => ({
    id: c.id, type: 'person' as const, title: c.name, posterPath: c.profilePath, year: null, subtitle: c.character,
  })));

  constructor() {
    effect(() => {
      const id = Number(this.id());
      const type = this.type();
      untracked(() => this.load(type, id));
    });
    effect(() => {
      const n = this.seasonNo();
      const d = this.d();
      if (n === null || !d || d.type !== 'tv') return;
      untracked(() => {
        this.season.set(null);
        this.api.season(d.id, n).pipe(catchError(() => of(null))).subscribe(s => this.season.set(s));
      });
    });
  }

  private load(type: MediaKind, id: number) {
    this.d.set(null); this.error.set(false); this.entry.set(null); this.favorite.set(false);
    this.episodes.set([]); this.season.set(null); this.seasonNo.set(null); this.editNotes.set(false);
    this.api.details(type, id).subscribe({
      next: d => {
        this.d.set(d);
        this.titleSvc.setTitle(`${d.title}${d.year ? ` (${d.year})` : ''} · ShowTracker`);
        if (d.type === 'tv' && d.seasons?.length) this.seasonNo.set(d.seasons[0].number);
      },
      error: () => this.error.set(true),
    });
    if (this.auth.signedIn()) {
      this.api.state(type, id).pipe(catchError(() => of(null))).subscribe(s => {
        if (!s) return;
        this.entry.set(s.entry);
        this.favorite.set(s.favorite);
        this.episodes.set(s.episodes ?? []);
        this.notes = s.entry?.notes ?? '';
        // Open the season where the user stopped.
        const last = s.episodes?.at(-1);
        const d = this.d();
        if (last && d?.seasons?.some(x => x.number === last.season)) {
          const s2 = d.seasons.find(x => x.number === last.season)!;
          this.seasonNo.set(last.episode >= s2.episodeCount && d.seasons.some(x => x.number === last.season + 1) ? last.season + 1 : last.season);
        }
      });
    }
  }

  private save(body: Parameters<Api['save']>[2], message?: string) {
    const d = this.d();
    if (!d) return;
    this.saving.set(true);
    this.api.save(d.type, d.id, body).subscribe({
      next: r => {
        this.entry.set(r.entry);
        this.saving.set(false);
        if (message) this.toast.show(message);
        if (body.markAllEpisodes) this.api.state(d.type, d.id).subscribe(s => this.episodes.set(s.episodes ?? []));
      },
      error: () => { this.saving.set(false); this.toast.error(); },
    });
  }

  setStatus(s: Status) {
    const d = this.d();
    if (!d || this.entry()?.status === s) return;
    const markAll = d.type === 'tv' && s === 'watched' && this.watchedCount() < (d.airedEpisodes ?? 0);
    this.save({ status: s, ...(markAll ? { markAllEpisodes: true } : {}) },
      s === 'planned' ? 'Added to your watchlist' : `Marked as ${STATUS_LABEL[s].toLowerCase()}`);
  }

  rate(v: number | null) { this.save({ rating: v }, v ? `Rated ${v / 2} / 5` : 'Rating removed'); }

  saveNotes() { this.save({ notes: this.notes.trim() || null }, 'Note saved'); this.editNotes.set(false); }

  removeEntry() {
    const d = this.d();
    if (!d) return;
    this.api.remove(d.type, d.id).subscribe({
      next: () => { this.entry.set(null); this.episodes.set([]); this.notes = ''; this.toast.show('Removed from your library'); },
      error: () => this.toast.error(),
    });
  }

  toggleFavorite() {
    const d = this.d();
    if (!d) return;
    const on = !this.favorite();
    this.favorite.set(on);
    (on ? this.api.addFavorite(d.type, d.id) : this.api.removeFavorite(d.type, d.id)).subscribe({
      next: () => this.toast.show(on ? 'Added to favourites' : 'Removed from favourites'),
      error: () => { this.favorite.set(!on); this.toast.error(); },
    });
  }

  isWatched(s: number, e: number) { return this.watched().has(`${s}:${e}`); }
  seasonDone(s: number, count: number) {
    if (!count) return false;
    let n = 0;
    for (const e of this.episodes()) if (e.season === s) n++;
    return n >= count;
  }
  aired(date: string | null) { return !!date && date <= new Date().toISOString().slice(0, 10); }
  airedIn(s: Season) { return s.episodes.filter(e => this.aired(e.airDate)); }

  toggleEpisode(season: number, episode: number) { this.setEpisodes(season, [episode], !this.isWatched(season, episode)); }
  toggleSeason(s: Season, watched: boolean) { this.setEpisodes(s.number, this.airedIn(s).map(e => e.number), watched); }

  private setEpisodes(season: number, eps: number[], watched: boolean) {
    const d = this.d();
    if (!d || !eps.length) return;
    // Optimistic update, rolled back on error.
    const before = this.episodes();
    const keys = new Set(eps.map(e => `${season}:${e}`));
    this.episodes.set(watched
      ? [...before.filter(x => !keys.has(`${x.season}:${x.episode}`)), ...eps.map(e => ({ season, episode: e }))]
      : before.filter(x => !keys.has(`${x.season}:${x.episode}`)));
    this.api.setEpisodes(d.id, season, eps, watched).subscribe({
      next: r => {
        const prev = this.entry()?.status;
        this.episodes.set(r.episodes);
        this.entry.set(r.entry);
        if (r.entry?.status === 'watched' && prev !== 'watched') this.toast.show(`You finished ${d.title}`);
      },
      error: () => { this.episodes.set(before); this.toast.error(); },
    });
  }

  providerGroups(d: Details) {
    return [
      { label: 'Stream', list: d.providers.stream },
      { label: 'Rent', list: d.providers.rent },
      { label: 'Buy', list: d.providers.buy },
    ].filter(g => g.list.length);
  }

  facts(d: Details) {
    const f: { k: string; v: string }[] = [];
    if (d.date) f.push({ k: d.type === 'tv' ? 'First aired' : 'Released', v: this.date(d.date) });
    if (d.type === 'tv' && d.airedEpisodes) f.push({ k: 'Episodes', v: String(d.airedEpisodes) });
    if (d.type === 'tv' && d.runtime) f.push({ k: 'Episode length', v: `~${d.runtime} min` });
    if (d.networks?.length) f.push({ k: 'Network', v: d.networks.map(n => n.name).join(', ') });
    if (d.status) f.push({ k: 'Status', v: d.status });
    return f;
  }

  votes(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k votes` : `${n} votes`; }
  date(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  regionName(code: string) {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; } catch { return code; }
  }
}
