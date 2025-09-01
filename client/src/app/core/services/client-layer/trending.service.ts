import { Injectable } from '@angular/core';
import { MediaType, TimeWindow, TrendingItem } from '../../models/trending.models';
import { mapTrendingList } from '../../mappers/trending.mapper';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { TrendingApiService } from '../api-layer/trending-api.service';

@Injectable({ providedIn: 'root' })
export class TrendingService {
  private cache = new Map<string, Observable<TrendingItem[]>>();

  constructor(private api: TrendingApiService) {}

  get$(mediaType: MediaType, timeWindow: TimeWindow, limit = 20): Observable<TrendingItem[]> {
    const key = `${mediaType}::${timeWindow}::${limit}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const obs = this.api.getTrending$(mediaType, timeWindow, limit).pipe(
      map(mapTrendingList),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  adminSync$(mediaType: MediaType, timeWindow: TimeWindow) {
    return this.api.syncTrending$(mediaType, timeWindow).pipe(
      tap(() => {
        [...this.cache.keys()]
          .filter(k => k.startsWith(`${mediaType}::${timeWindow}::`))
          .forEach(k => this.cache.delete(k));
      })
    );
  }
}
