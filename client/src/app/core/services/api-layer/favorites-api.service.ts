import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FavoritesListDto } from '../../dtos/favorites.dtos';
import { MediaType } from '../../types/media.types';

@Injectable({ providedIn: 'root' })
export class FavoritesApiService {
  private base = `${environment.apiBaseUrl}/api/favorites`;

  constructor(private http: HttpClient) {}

  add$(type: MediaType, tmdbId: number) {
    return this.http.post<{ ok: true }>(`${this.base}/${type}/${tmdbId}`, {});
  }

  remove$(type: MediaType, tmdbId: number) {
    return this.http.delete<{ ok: true }>(`${this.base}/${type}/${tmdbId}`);
  }

  list$(type: MediaType) : Observable<FavoritesListDto> {
    return this.http.get<FavoritesListDto>(`${this.base}/${type}`);
  }

  listHydrated$(type: MediaType) {
    const params = new HttpParams().set('full', 'true');
    return this.http.get<{ items: any[] }>(`${this.base}/${type}`, { params });
  }
}
