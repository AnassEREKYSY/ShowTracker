import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { MovieDto, MovieSummaryDto, PagedDto } from '../../dtos/movie.dtos';

export interface DiscoverQueryDto {
  page?: number;
  sort_by?: string;
  with_genres?: string;
  year?: number;
}

@Injectable({ providedIn: 'root' })

export class MoviesApiService {
  private base = `${environment.apiBaseUrl}/movies`;

  constructor(private http: HttpClient) {}

  getById$(id: number): Observable<MovieDto> {
    return this.http.get<MovieDto>(`${this.base}/${id}`);
  }

  getPopular$(page = 1): Observable<PagedDto<MovieSummaryDto>> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<PagedDto<MovieSummaryDto>>(`${this.base}/popular`, { params });
  }

  discover$(q: DiscoverQueryDto = {}): Observable<PagedDto<MovieSummaryDto>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', String(q.page));
    if (q.sort_by) params = params.set('sort_by', q.sort_by);
    if (q.with_genres) params = params.set('with_genres', q.with_genres);
    if (typeof q.year === 'number') params = params.set('year', String(q.year));

    return this.http.get<PagedDto<MovieSummaryDto>>(`${this.base}/discover`, { params });
  }
}
