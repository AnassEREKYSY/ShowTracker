import { WATCH_REGION } from '../config';

export type MediaKind = 'movie' | 'tv';

/** Compact item used by every list in the client (cards, rows, search). */
export type MediaCard = {
  id: number;
  type: MediaKind | 'person';
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  overview?: string;
  genreIds?: number[];
  knownFor?: string;
};

const yearOf = (d?: string | null) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

export function toCard(r: any, fallbackType?: MediaKind): MediaCard | null {
  const type = (r.media_type as MediaCard['type']) ?? fallbackType;
  if (!r?.id || !type) return null;
  if (type === 'person') {
    return {
      id: r.id,
      type,
      title: r.name ?? '',
      year: null,
      posterPath: r.profile_path ?? null,
      backdropPath: null,
      rating: null,
      knownFor: r.known_for_department ?? undefined,
    };
  }
  return {
    id: r.id,
    type,
    title: (type === 'movie' ? r.title ?? r.original_title : r.name ?? r.original_name) ?? '',
    year: yearOf(type === 'movie' ? r.release_date : r.first_air_date),
    posterPath: r.poster_path ?? null,
    backdropPath: r.backdrop_path ?? null,
    rating: typeof r.vote_average === 'number' ? Math.round(r.vote_average * 10) / 10 : null,
    overview: r.overview ?? undefined,
    genreIds: r.genre_ids ?? undefined,
  };
}

export function toPage(data: any, fallbackType?: MediaKind) {
  return {
    page: data?.page ?? 1,
    totalPages: Math.min(data?.total_pages ?? 1, 500), // TMDB caps paging at 500
    totalResults: data?.total_results ?? 0,
    results: ((data?.results ?? []) as any[]).map(r => toCard(r, fallbackType)).filter(Boolean) as MediaCard[],
  };
}

/** Best YouTube trailer: official trailer > trailer > teaser. */
export function pickTrailer(videos: any): { key: string; name: string } | null {
  const list: any[] = (videos?.results ?? []).filter((v: any) => v.site === 'YouTube' && v.key);
  const score = (v: any) => (v.type === 'Trailer' ? 2 : v.type === 'Teaser' ? 1 : 0) + (v.official ? 1 : 0);
  const best = list.filter(v => score(v) > 0).sort((a, b) => score(b) - score(a))[0];
  return best ? { key: best.key, name: best.name } : null;
}

type Provider = { id: number; name: string; logoPath: string | null };
export type WatchProviders = { region: string; link: string | null; stream: Provider[]; rent: Provider[]; buy: Provider[] };

export function pickProviders(raw: any, region = WATCH_REGION): WatchProviders {
  const r = raw?.results?.[region] ?? {};
  const map = (l: any[] = []) => l
    .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
    .map(p => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null }));
  return { region, link: r.link ?? null, stream: map(r.flatrate), rent: map(r.rent), buy: map(r.buy) };
}

/** Number of aired episodes, specials (season 0) excluded. */
export function airedEpisodes(tv: any): number {
  const seasons: any[] = (tv?.seasons ?? []).filter((s: any) => s.season_number > 0);
  const last = tv?.last_episode_to_air;
  if (!last) return seasons.reduce((n, s) => n + (s.episode_count ?? 0), 0);
  return seasons.reduce((n, s) => {
    if (s.season_number < last.season_number) return n + (s.episode_count ?? 0);
    if (s.season_number === last.season_number) return n + last.episode_number;
    return n;
  }, 0);
}

export function episodeRuntime(tv: any): number {
  const r = (tv?.episode_run_time ?? []).find((n: number) => n > 0);
  return r ?? tv?.last_episode_to_air?.runtime ?? 40;
}
