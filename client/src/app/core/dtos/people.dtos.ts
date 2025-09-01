export interface PagedDto<T> {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
}

export interface PeopleSearchResponseDto {
  items: PersonSummaryDto[];
  page: number;
  totalPages?: number;
}

export interface KnownForDto {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface PersonSummaryDto {
  id: number;
  name: string;
  profile_path?: string | null;
  popularity?: number;
  known_for?: KnownForDto[];
}

export interface CreditDto {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string; 
  character?: string;
  job?: string;
  department?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface CombinedCreditsDto {
  cast: CreditDto[];
  crew: CreditDto[];
}

export interface PersonDto extends PersonSummaryDto {
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  also_known_as?: string[];
  combined_credits?: CombinedCreditsDto;
}
