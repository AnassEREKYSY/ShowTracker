import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { PeopleSearchResponseDto, PersonDto } from '../../dtos/people.dtos';

@Injectable({ providedIn: 'root' })

export class PeopleApiService {
  private base = `${environment.apiBaseUrl}/api/people`;

  constructor(private http: HttpClient) {}

  search$(q: string, page = 1): Observable<PeopleSearchResponseDto> {
    const params = new HttpParams().set('q', q).set('page', String(page));
    return this.http.get<PeopleSearchResponseDto>(this.base, { params });
  }

  getOne$(tmdbId: number): Observable<PersonDto> {
    return this.http.get<PersonDto>(`${this.base}/${tmdbId}`);
  }
}
