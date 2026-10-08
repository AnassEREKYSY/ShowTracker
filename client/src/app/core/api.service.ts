import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Details, DiaryItem, EpisodeRef, Favorite, Genre, LibraryEntry, MediaCard, MediaKind, Paged, Person, Season, Stats,
  Status, TitleState, UpNext,
} from './models';

const clean = (o: Record<string, unknown>) =>
  new HttpParams({ fromObject: Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Record<string, string> });

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  // Catalog (public)
  trending(type: 'all' | MediaKind = 'all', window: 'day' | 'week' = 'week') {
    return this.http.get<Paged<MediaCard>>(`${this.base}/trending`, { params: { type, window } });
  }
  popular(type: MediaKind, page = 1) { return this.http.get<Paged<MediaCard>>(`${this.base}/${type}/popular`, { params: { page } }); }
  discover(type: MediaKind, f: { page?: number; genre?: string; year?: string; minRating?: string; sort?: string }) {
    return this.http.get<Paged<MediaCard>>(`${this.base}/discover/${type}`, { params: clean(f) });
  }
  genres(type: MediaKind) { return this.http.get<Genre[]>(`${this.base}/genres/${type}`); }
  search(q: string, page = 1) { return this.http.get<Paged<MediaCard>>(`${this.base}/search`, { params: { q, page } }); }
  details(type: MediaKind, id: number) { return this.http.get<Details>(`${this.base}/${type}/${id}`); }
  season(id: number, n: number) { return this.http.get<Season>(`${this.base}/tv/${id}/season/${n}`); }
  person(id: number) { return this.http.get<Person>(`${this.base}/person/${id}`); }

  // Personal
  library(f: { status?: Status; type?: MediaKind } = {}) {
    return this.http.get<{ items: LibraryEntry[] }>(`${this.base}/library`, { params: clean(f) });
  }
  state(type: MediaKind, id: number) { return this.http.get<TitleState>(`${this.base}/library/${type}/${id}`); }
  save(type: MediaKind, id: number, body: Partial<{ status: Status; rating: number | null; notes: string | null; watchedAt: string | null; markAllEpisodes: boolean }>) {
    return this.http.put<{ entry: LibraryEntry }>(`${this.base}/library/${type}/${id}`, body);
  }
  remove(type: MediaKind, id: number) { return this.http.delete<{ ok: true }>(`${this.base}/library/${type}/${id}`); }
  setEpisodes(id: number, season: number, episodes: number[], watched: boolean) {
    return this.http.put<{ entry: LibraryEntry | null; episodes: EpisodeRef[] }>(`${this.base}/library/tv/${id}/episodes`, { season, episodes, watched });
  }
  upNext() { return this.http.get<{ items: UpNext[] }>(`${this.base}/library/up-next`); }
  diary(limit = 100) { return this.http.get<{ items: DiaryItem[] }>(`${this.base}/diary`, { params: { limit } }); }
  stats() { return this.http.get<Stats>(`${this.base}/stats`); }

  favorites(type: MediaKind | 'person') { return this.http.get<{ items: Favorite[] }>(`${this.base}/favorites/${type}`); }
  addFavorite(type: MediaKind | 'person', id: number) { return this.http.post(`${this.base}/favorites/${type}/${id}`, {}); }
  removeFavorite(type: MediaKind | 'person', id: number) { return this.http.delete(`${this.base}/favorites/${type}/${id}`); }
}
