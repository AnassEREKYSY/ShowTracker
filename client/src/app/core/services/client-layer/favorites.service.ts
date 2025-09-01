import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { FavoritesApiService } from '../api-layer/favorites-api.service';
import { FavoriteItem } from '../../models/favorites.model';
import { mapFavoriteRow } from '../../mappers/favorites.mapper';
import { MediaType } from '../../types/media.types';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private listCache = new Map<MediaType, Observable<FavoriteItem[]>>();

  constructor(private api: FavoritesApiService) {}

  list$(type: MediaType): Observable<FavoriteItem[]> {
    const hit = this.listCache.get(type);
    if (hit) return hit;

    const obs = this.api.list$(type).pipe(
      map(resp => (resp.items ?? []).map(mapFavoriteRow)),
      shareReplay(1)
    );
    this.listCache.set(type, obs);
    return obs;
  }

  add$(type: MediaType, tmdbId: number) {
    return this.api.add$(type, tmdbId).pipe(
      tap(() => this.listCache.delete(type))
    );
  }

  remove$(type: MediaType, tmdbId: number) {
    return this.api.remove$(type, tmdbId).pipe(
      tap(() => this.listCache.delete(type))
    );
  }

  listHydrated$(type: MediaType) {
    return this.api.listHydrated$(type);
  }
}
