import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { TimeWindowDto, TrendingListResponseDto, TrendingSyncResponseDto } from '../../dtos/trending.dtos';
import { MediaType } from '../../types/media.types';

@Injectable({ providedIn: 'root' })
export class TrendingApiService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getTrending$(mediaType: MediaType, timeWindow: TimeWindowDto, limit = 20)
  : Observable<TrendingListResponseDto> {
    const params = new HttpParams()
      .set('mediaType', mediaType)
      .set('timeWindow', timeWindow)
      .set('limit', String(limit));
    return this.http.get<TrendingListResponseDto>(`${this.base}/trending`, { params });
  }

  syncTrending$(mediaType: MediaType, timeWindow: TimeWindowDto)
  : Observable<TrendingSyncResponseDto> {
    const params = new HttpParams()
      .set('mediaType', mediaType)
      .set('timeWindow', timeWindow);
    return this.http.post<TrendingSyncResponseDto>(`${this.base}/admin/trending/sync`, {}, { params });
  }
}
