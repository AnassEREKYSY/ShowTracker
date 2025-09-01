import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Paged, Person, PersonSummary } from '../../models/people.models';
import { mapPeopleSearch, mapPerson } from '../../mappers/people.mapper';
import { PeopleApiService } from '../api-layer/people-api.service';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private personCache = new Map<number, Observable<Person>>();
  private searchCache = new Map<string, Observable<Paged<PersonSummary>>>();

  constructor(private api: PeopleApiService) {}

  search$(q: string, page = 1): Observable<Paged<PersonSummary>> {
    const key = `${q}::${page}`;
    const hit = this.searchCache.get(key);
    if (hit) return hit;

    const obs = this.api.search$(q, page).pipe(
      map(mapPeopleSearch),
      shareReplay(1)
    );
    this.searchCache.set(key, obs);
    return obs;
  }

  getOne$(tmdbId: number): Observable<Person> {
    const hit = this.personCache.get(tmdbId);
    if (hit) return hit;

    const obs = this.api.getOne$(tmdbId).pipe(
      map(mapPerson),
      shareReplay(1)
    );
    this.personCache.set(tmdbId, obs);
    return obs;
  }
}
