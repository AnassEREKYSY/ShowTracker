import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Movie, MovieSummary, Paged } from '../../models/movie.models';
import { mapMovie, mapMovieSummary, mapPaged } from '../../mappers/movie.mapper';
import { MoviesApiService } from '../api-layer/movie-api.service';

export interface DiscoverQuery {
  page?: number;
  sortBy?: string;
  withGenres?: string;
  year?: number;
}

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movieCache = new Map<number, Observable<Movie>>();
  private popularCache = new Map<number, Observable<Paged<MovieSummary>>>();
  private discoverCache = new Map<string, Observable<Paged<MovieSummary>>>();

  constructor(private api: MoviesApiService) {}

  getMovie$(id: number): Observable<Movie> {
    const existing = this.movieCache.get(id);
    if (existing) return existing;

    const obs = this.api.getById$(id).pipe(
      map(mapMovie),
      shareReplay(1)
    );
    this.movieCache.set(id, obs);
    return obs;
  }

  getPopular$(page = 1): Observable<Paged<MovieSummary>> {
    const existing = this.popularCache.get(page);
    if (existing) return existing;

    const obs = this.api.getPopular$(page).pipe(
      map(dto => mapPaged(dto, mapMovieSummary)),
      shareReplay(1)
    );
    this.popularCache.set(page, obs);
    return obs;
  }

  discover$(q: DiscoverQuery = {}): Observable<Paged<MovieSummary>> {
    const key = JSON.stringify(q ?? {});
    const existing = this.discoverCache.get(key);
    if (existing) return existing;

    const dtoQuery = {
      page: q.page,
      sort_by: q.sortBy,
      with_genres: q.withGenres,
      year: q.year,
    };

    const obs = this.api.discover$(dtoQuery).pipe(
      map(dto => mapPaged(dto, mapMovieSummary)),
      shareReplay(1)
    );
    this.discoverCache.set(key, obs);
    return obs;
  }
}
