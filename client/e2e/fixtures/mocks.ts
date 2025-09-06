export type TmdbMovieDto = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
};

export type PagedDto<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export function makeMovie(id: number, seed = 0): TmdbMovieDto {
  const year = 2024 - (seed % 3);
  return {
    id,
    title: `Mock Movie ${id}`,
    overview: `Overview for Mock Movie ${id}`,
    release_date: `${year}-08-0${(id % 9) + 1}`,
    poster_path: `/poster_${id}.jpg`,
    backdrop_path: `/backdrop_${id}.jpg`,
    vote_average: Number((8.1 + (id % 3) * 0.2).toFixed(1)),
  };
}

export function pagedMovies(page: number, perPage: number, totalPages: number, startId = 1): PagedDto<TmdbMovieDto> {
  const baseId = startId + (page - 1) * perPage;
  const results = Array.from({ length: perPage }, (_, i) => makeMovie(baseId + i, baseId + i));
  return {
    page,
    results,
    total_pages: totalPages,
    total_results: totalPages * perPage,
  };
}

export function discoverFirst(): PagedDto<TmdbMovieDto> {
  return {
    page: 1,
    results: [makeMovie(101)],
    total_pages: 1,
    total_results: 1,
  };
}
