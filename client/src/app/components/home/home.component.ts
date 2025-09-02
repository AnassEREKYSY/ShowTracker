import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MovieSummary } from '../../core/models/movie.models';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MoviesService } from '../../core/services/client-layer/movie.service';

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

  hero$: Observable<MovieSummary | undefined> = this.movies
    .discover$({ page: 1, sortBy: 'popularity.desc' })
    .pipe(map(p => p.results[0]));

  popular$ = this.movies.getPopular$(1);

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
