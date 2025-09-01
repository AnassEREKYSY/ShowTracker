import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { WatchlistApiService } from '../api-layer/watchlist-api.service';
import { WatchlistItem } from '../../models/watchlist.model';
import { mapWatchlistRow } from '../../mappers/watchlist.mapper';
import { MediaType } from '../../types/media.types';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private listCache = new Map<MediaType, Observable<WatchlistItem[]>>();

  constructor(private api: WatchlistApiService) {}

  list$(type: MediaType): Observable<WatchlistItem[]> {
    const hit = this.listCache.get(type);
    if (hit) return hit;

    const obs = this.api.list$(type).pipe(
      map(resp => (resp.items ?? []).map(mapWatchlistRow)),
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
