import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { WatchlistListDto } from '../../dtos/watchlist.dtos';
import { MediaType } from '../../types/media.types';

@Injectable({ providedIn: 'root' })
export class WatchlistApiService {
  private base = `${environment.apiBaseUrl}/watchlist`;

  constructor(private http: HttpClient) {}

  add$(type: MediaType, tmdbId: number) {
    return this.http.post<{ ok: true }>(`${this.base}/${type}/${tmdbId}`, {});
  }

  remove$(type: MediaType, tmdbId: number) {
    return this.http.delete<{ ok: true }>(`${this.base}/${type}/${tmdbId}`);
  }

  list$(type: MediaType): Observable<WatchlistListDto> {
    return this.http.get<WatchlistListDto>(`${this.base}/${type}`);
  }

  listHydrated$(type: MediaType) {
    return this.http.get<{ items: any[] }>(`${this.base}/${type}`, { params: { full: 'true' } });
  }
}
