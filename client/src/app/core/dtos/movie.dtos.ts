export interface PagedDto<T> {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
}

export interface MovieSummaryDto {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
}

export interface GenreDto { id: number; name: string; }

export interface CastDto {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}
export interface CrewDto {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
}
export interface CreditsDto { cast: CastDto[]; crew: CrewDto[]; }

export interface VideoDto {
  id: string;
  key: string;
  name: string;
  site: 'YouTube' | string;
  type: 'Trailer' | 'Teaser' | string;
}
export interface VideosDto { results: VideoDto[]; }

export interface MovieDto extends MovieSummaryDto {
  runtime?: number;
  genres?: GenreDto[];
  credits?: CreditsDto;
  videos?: VideosDto;
}
