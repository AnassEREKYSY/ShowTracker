import { PeopleSearchResponseDto, PersonSummaryDto, PersonDto, KnownForDto, CreditDto } from '../dtos/people.dtos';
import { Paged, PersonSummary, Person, KnownForItem, RoleCredit, MediaType } from '../models/people.models';

const year = (d?: string) => (d ? Number((d + '').slice(0, 4)) : undefined);

function titleFrom(mediaType: MediaType, dto: { title?: string; name?: string }) {
  return mediaType === 'movie' ? (dto.title ?? '') : (dto.name ?? '');
}

export function mapKnownFor(k: KnownForDto): KnownForItem {
  const mediaType = k.media_type;
  return {
    id: k.id,
    mediaType,
    title: titleFrom(mediaType, k),
    posterPath: k.poster_path ?? null,
    voteAverage: k.vote_average,
    year: year(mediaType === 'movie' ? k.release_date : k.first_air_date),
  };
}

export function mapPersonSummary(dto: PersonSummaryDto): PersonSummary {
  return {
    id: dto.id,
    name: dto.name,
    profilePath: dto.profile_path ?? null,
    popularity: dto.popularity,
    knownFor: dto.known_for?.map(mapKnownFor),
  };
}

function mapRole(c: CreditDto): RoleCredit {
  const mediaType = c.media_type;
  return {
    id: c.id,
    mediaType,
    title: titleFrom(mediaType, c),
    posterPath: c.poster_path ?? null,
    voteAverage: c.vote_average,
    year: year(mediaType === 'movie' ? c.release_date : c.first_air_date),
    character: c.character,
    job: c.job,
    department: c.department,
  };
}

export function mapPerson(dto: PersonDto): Person {
  return {
    ...mapPersonSummary(dto),
    biography: dto.biography,
    birthday: dto.birthday ?? null,
    placeOfBirth: dto.place_of_birth ?? null,
    alsoKnownAs: dto.also_known_as ?? [],
    combinedCredits: dto.combined_credits
      ? {
          cast: dto.combined_credits.cast?.map(mapRole) ?? [],
          crew: dto.combined_credits.crew?.map(mapRole) ?? [],
        }
      : undefined,
  };
}

export function mapPeopleSearch(resp: PeopleSearchResponseDto): Paged<PersonSummary> {
  return {
    page: resp.page,
    results: resp.items?.map(mapPersonSummary) ?? [],
    totalPages: resp.totalPages,
  };
}
