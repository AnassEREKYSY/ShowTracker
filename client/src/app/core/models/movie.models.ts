export interface Genre { id: number; name: string; }

export interface PersonCast {
  id: number;
  name: string;
  character?: string;
  profilePath?: string | null;
  order?: number;
}

export interface PersonCrew {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profilePath?: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieSummary {
  id: number;
  title: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
}

export interface Movie extends MovieSummary {
  runtime?: number;
  genres?: Genre[];
  credits?: { cast: PersonCast[]; crew: PersonCrew[] };
  videos?: { results: Video[] };
}

export interface Paged<T> {
  page: number;
  results: T[];
  totalPages?: number;
  totalResults?: number;
}
