import { MovieDto, MovieSummaryDto, PagedDto, GenreDto, CastDto, CrewDto, VideoDto } from '../dtos/movie.dtos';
import { Movie, MovieSummary, Paged, Genre, PersonCast, PersonCrew, Video } from '../models/movie.models';

export function mapMovieSummary(dto: MovieSummaryDto): MovieSummary {
  return {
    id: dto.id,
    title: dto.title,
    overview: dto.overview,
    releaseDate: dto.release_date,
    posterPath: dto.poster_path ?? null,
    backdropPath: dto.backdrop_path ?? null,
    voteAverage: dto.vote_average,
  };
}

export function mapGenre(g: GenreDto): Genre {
  return { id: g.id, name: g.name };
}

export function mapCast(c: CastDto): PersonCast {
  return {
    id: c.id,
    name: c.name,
    character: c.character,
    profilePath: c.profile_path ?? null,
    order: c.order,
  };
}

export function mapCrew(c: CrewDto): PersonCrew {
  return {
    id: c.id,
    name: c.name,
    job: c.job,
    department: c.department,
    profilePath: c.profile_path ?? null,
  };
}

export function mapVideo(v: VideoDto): Video {
  return { id: v.id, key: v.key, name: v.name, site: v.site, type: v.type };
}

export function mapMovie(dto: MovieDto): Movie {
  return {
    ...mapMovieSummary(dto),
    runtime: dto.runtime,
    genres: dto.genres?.map(mapGenre),
    credits: dto.credits
      ? { cast: dto.credits.cast?.map(mapCast) ?? [], crew: dto.credits.crew?.map(mapCrew) ?? [] }
      : undefined,
    videos: dto.videos
      ? { results: dto.videos.results?.map(mapVideo) ?? [] }
      : undefined,
  };
}

export function mapPaged<TDto, TModel>(
  p: PagedDto<TDto>,
  mapper: (d: TDto) => TModel
): Paged<TModel> {
  return {
    page: p.page,
    results: p.results?.map(mapper) ?? [],
    totalPages: p.total_pages,
    totalResults: p.total_results,
  };
}
