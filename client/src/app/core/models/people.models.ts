export interface Paged<T> {
  page: number;
  results: T[];
  totalPages?: number;
  totalResults?: number;
}

export type MediaType = 'movie' | 'tv';

export interface KnownForItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  voteAverage?: number;
  year?: number;
}

export interface PersonSummary {
  id: number;
  name: string;
  profilePath?: string | null;
  popularity?: number;
  knownFor?: KnownForItem[];
}

export interface RoleCredit {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string | null;
  voteAverage?: number;
  year?: number;
  character?: string;
  job?: string;
  department?: string;
}

export interface Person extends PersonSummary {
  biography?: string;
  birthday?: string | null;
  placeOfBirth?: string | null;
  alsoKnownAs?: string[];
  combinedCredits?: { cast: RoleCredit[]; crew: RoleCredit[] };
}
