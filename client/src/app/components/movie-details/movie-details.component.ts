import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, startWith, switchMap, take } from 'rxjs/operators';

import { FavoritesService } from '../../core/services/client-layer/favorites.service';
import { WatchlistService } from '../../core/services/client-layer/watchlist.service';
import { MediaType } from '../../core/types/media.types';
import { MoviesService } from '../../core/services/client-layer/movie.service';

type MovieAny = any;

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieDetailsComponent {
  private readonly IMG_ORIG = 'https://image.tmdb.org/t/p/original';
  private readonly IMG_W500 = 'https://image.tmdb.org/t/p/w500';

  private id$ = this.route.paramMap.pipe(
    map(pm => Number(pm.get('id') ?? '0')),
    map(n => (Number.isFinite(n) && n > 0 ? n : 0))
  );

  private refresh$ = new BehaviorSubject<void>(undefined);

  movie$ = combineLatest([this.id$, this.refresh$.pipe(startWith(undefined))]).pipe(
    switchMap(([id]) => (id ? this.movies.getMovie$(id) : of(null))),
    map((m: MovieAny | null) => {
      if (!m) return null;

      const title = m.title ?? m.name ?? '—';
      const releaseDate = m.releaseDate ?? m.release_date ?? '';
      const runtime = m.runtime ?? 0;
      const vote = m.voteAverage ?? m.vote_average ?? 0;
      const genres = (m.genres ?? []) as { id: number; name: string }[];
      const overview = m.overview ?? '';

      const backdrop = (m.backdropPath ?? m.backdrop_path) ?? null;
      const poster = (m.posterPath ?? m.poster_path) ?? null;

      const credits = m.credits ?? {};
      const cast = (credits.cast ?? []).slice(0, 12);
      const directorArr = (credits.crew ?? []).filter((c: any) => c.job === 'Director');

      const videos = (m.videos?.results ?? []).filter((v: any) => v.site === 'YouTube');
      const trailer = videos.find((v: any) => v.type === 'Trailer') ?? videos[0] ?? null;

      return {
        raw: m,
        id: m.id,
        title,
        releaseDate,
        year: releaseDate ? String(releaseDate).slice(0, 4) : '',
        runtime,
        vote: vote ? Number(vote).toFixed(1) : '—',
        genres,
        genreText: genres.map(g => g.name).join(', '),
        overview,
        backdropUrl: backdrop ? `${this.IMG_ORIG}${backdrop}` : (poster ? `${this.IMG_ORIG}${poster}` : null),
        posterUrl: poster ? `${this.IMG_W500}${poster}` : null,
        cast,
        director: directorArr,
        directorText: directorArr.map((d: any) => d.name).join(', '),
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      };
    })
  );

  constructor(
    private route: ActivatedRoute,
    private movies: MoviesService,
    private favs: FavoritesService,
    private watch: WatchlistService
  ) {}

  isFavFor(id: number) {
    return this.favs.list$('movie' as MediaType).pipe(map(list => list.some(x => x.tmdbId === id)));
  }
  isWatchFor(id: number) {
    return this.watch.list$('movie' as MediaType).pipe(map(list => list.some(x => x.tmdbId === id)));
  }

  toggleFavorite(id: number) {
    this.isFavFor(id).pipe(take(1)).subscribe(current => {
      const action$ = current
        ? this.favs.remove$('movie' as MediaType, id)
        : this.favs.add$('movie' as MediaType, id);
      action$.subscribe({ next: () => this.refresh$.next(), error: () => this.refresh$.next() });
    });
  }

  toggleWatch(id: number) {
    this.isWatchFor(id).pipe(take(1)).subscribe(current => {
      const action$ = current
        ? this.watch.remove$('movie' as MediaType, id)
        : this.watch.add$('movie' as MediaType, id);
      action$.subscribe({
        next: () => {
          this.refresh$.next();
          document.dispatchEvent(new CustomEvent('watchlist:changed'));
        },
        error: () => {
          this.refresh$.next();
          document.dispatchEvent(new CustomEvent('watchlist:changed'));
        },
      });
    });
  }

  openTrailer(url: string | null) {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  minuteText(min: number | undefined) {
    if (!min || !Number.isFinite(min)) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
}
