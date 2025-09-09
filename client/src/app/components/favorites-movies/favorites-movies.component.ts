import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { FavoritesService } from '../../core/services/client-layer/favorites.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';

type CardMovie = {
  id: number;
  title?: string;
  posterPath?: string | null;
};

@Component({
  selector: 'app-favorites-movies',
  standalone: true,
  imports: [CommonModule, RouterLink, MovieCardComponent],
  templateUrl: './favorites-movies.component.html',
  styleUrls: ['./favorites-movies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesMoviesComponent {
  private platformId = inject(PLATFORM_ID);

  movies$ = (isPlatformBrowser(this.platformId)
    ? this.favs.list$('movie')
    : of([])
  ).pipe(
    map(items =>
      items.map<CardMovie>(f => ({
        id: f.tmdbId,
        title: f.title ?? undefined,
        posterPath: f.posterPath ?? null,
      }))
    )
  );

  constructor(private favs: FavoritesService) {}

  trackById = (_: number, m: { id: number }) => m.id;
}
