import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { map, scan, startWith, switchMap, shareReplay } from 'rxjs/operators';
import { MovieSummary } from '../../core/models/movie.models';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MoviesService } from '../../core/services/client-layer/movie.service';

type PopState = {
  loadedPages: number;
  totalPages?: number;
  items: MovieSummary[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MovieCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private movies = inject(MoviesService);

  hero$ = this.movies
    .discover$({ page: 1, sortBy: 'popularity.desc' })
    .pipe(map(p => p.results[0]));

  private loadMore$ = new Subject<void>();

  private page$ = this.loadMore$.pipe(
    startWith(void 0),
    scan(page => page + 1, 0)
  );

  popularState$ = this.page$.pipe(
    switchMap(page => this.movies.getPopular$(page)),
    scan<ReturnType<MoviesService['getPopular$']> extends infer T
        ? T extends import('rxjs').Observable<infer R> ? R : never
        : never,
        PopState>(
      (state, pageData: any) => ({
        loadedPages: pageData.page,
        totalPages: pageData.totalPages ?? state.totalPages,
        items: [...state.items, ...pageData.results as MovieSummary[]],
      }),
      { loadedPages: 0, totalPages: undefined, items: [] }
    ),
    shareReplay(1)
  );

  loadMore() {
    this.loadMore$.next();
  }

  backdropUrl(m?: any) {
    const p = m?.backdropPath ?? m?.backdrop_path ?? m?.posterPath ?? m?.poster_path;
    return p ? `https://image.tmdb.org/t/p/w1280${p}` : '';
  }
  year(d?: string) {
    return (d ?? '').slice(0, 4) || '—';
  }
  onHeroImgError(ev: Event) {
    const img = ev.target as HTMLImageElement | null;
    if (img) img.style.visibility = 'hidden';
  }
}
