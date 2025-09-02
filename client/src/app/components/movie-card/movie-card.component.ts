import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, startWith, take } from 'rxjs/operators';

import { MovieDto, MovieSummaryDto } from '../../core/dtos/movie.dtos';
import { FavoritesService } from '../../core/services/client-layer/favorites.service';

/** Accept both API DTO (snake_case) and mapped model (camelCase) */
type AnyMovie =
  | (MovieSummaryDto & Partial<MovieDto>)
  | {
      id: number;
      title?: string;
      releaseDate?: string;
      posterPath?: string | null;
      backdropPath?: string | null;
      voteAverage?: number;
      genres?: { id: number; name: string }[];
    };

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieCardComponent implements OnChanges {
  @Input({ required: true }) movie!: AnyMovie;
  @Input() link: any[] | string = [];
  @Input() yearOnly = true;

  private readonly IMG_BASE = 'https://image.tmdb.org/t/p/w500';
  constructor(private favs: FavoritesService) {}

  get title(): string { return (this.movie as any).title ?? '—'; }

  get releaseText(): string {
    const d = (this.movie as any).release_date ?? (this.movie as any).releaseDate ?? '';
    if (!d) return 'Unknown date';
    return this.yearOnly ? d.slice(0, 4) : new Date(d).toLocaleDateString();
  }

  get genresText(): string {
    const g = (this.movie as any).genres as { name: string }[] | undefined;
    return g?.length ? g.map(x => x.name).join(' · ') : '—';
  }

  get rating(): string {
    const n = (this.movie as any).vote_average ?? (this.movie as any).voteAverage ?? 0;
    return n ? Number(n).toFixed(1) : '—';
  }

  get routerLink(): any[] | string {
    const link = this.link;
    if (Array.isArray(link) ? link.length : !!link) return link;
    return ['/movies', (this.movie as any).id];
  }

  private get posterPath(): string | null {
    return (this.movie as any).poster_path ?? (this.movie as any).posterPath ?? null;
  }
  get hasPoster(): boolean { return !!this.posterPath; }
  posterUrl(): string { return `${this.IMG_BASE}${this.posterPath}`; }

  private movieId$ = new BehaviorSubject<number | null>(null);
  private refresh$ = new BehaviorSubject<void>(undefined);

  isFav$ = combineLatest([
    this.movieId$,
    this.refresh$.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([id]) =>
      this.favs.list$('movie').pipe(
        map(list => !!id && list.some(x => x.tmdbId === id))
      )
    )
  );

  ngOnChanges(): void {
    const id = (this.movie as any)?.id;
    if (typeof id === 'number') this.movieId$.next(id);
  }

  toggleFavorite(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    const id = this.movieId$.value;
    if (!id) return;

    this.isFav$.pipe(take(1)).subscribe(current => {
      const action$ = current
        ? this.favs.remove$('movie', id)
        : this.favs.add$('movie', id);

      action$.subscribe({
        next: () => this.refresh$.next(),
        error: () => this.refresh$.next(),
      });
    });
  }
}
