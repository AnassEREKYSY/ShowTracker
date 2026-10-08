import { Request, Response } from 'express';
import { tmdbCached, TTL } from '../tmdb';
import { airedEpisodes, episodeRuntime, pickProviders, pickTrailer, toCard, toPage, MediaKind } from '../services/media';

const isKind = (v: unknown): v is MediaKind => v === 'movie' || v === 'tv';
const pageOf = (q: unknown) => Math.min(500, Math.max(1, Number(q) || 1));

function fail(res: Response, err: any, msg: string) {
  const status = err?.response?.status;
  return res.status(status === 404 ? 404 : 502).json({ message: status === 404 ? 'Not found' : msg });
}

// GET /api/trending?type=all|movie|tv&window=day|week
export async function trending(req: Request, res: Response) {
  const type = ['all', 'movie', 'tv'].includes(String(req.query.type)) ? String(req.query.type) : 'all';
  const window = req.query.window === 'day' ? 'day' : 'week';
  try {
    const data = await tmdbCached(`trending:${type}:${window}`, TTL.medium, `/trending/${type}/${window}`);
    const page = toPage(data);
    page.results = page.results.filter(r => r.type !== 'person');
    res.json(page);
  } catch (e) { fail(res, e, 'Trending failed'); }
}

// GET /api/:type/popular?page=
export async function popular(req: Request, res: Response) {
  const type = req.params.type;
  if (!isKind(type)) return res.status(400).json({ message: 'Invalid type' });
  const page = pageOf(req.query.page);
  try {
    res.json(toPage(await tmdbCached(`popular:${type}:${page}`, TTL.short, `/${type}/popular`, { page }), type));
  } catch (e) { fail(res, e, 'Popular failed'); }
}

const SORTS: Record<string, Record<MediaKind, string>> = {
  popular: { movie: 'popularity.desc', tv: 'popularity.desc' },
  rating: { movie: 'vote_average.desc', tv: 'vote_average.desc' },
  newest: { movie: 'primary_release_date.desc', tv: 'first_air_date.desc' },
};

// GET /api/discover/:type?page=&genre=&year=&minRating=&sort=popular|rating|newest
export async function discover(req: Request, res: Response) {
  const type = req.params.type;
  if (!isKind(type)) return res.status(400).json({ message: 'Invalid type' });
  const page = pageOf(req.query.page);
  const sort = SORTS[String(req.query.sort)] ? String(req.query.sort) : 'popular';
  const genre = /^\d+(,\d+)*$/.test(String(req.query.genre ?? '')) ? String(req.query.genre) : undefined;
  const year = /^\d{4}$/.test(String(req.query.year ?? '')) ? Number(req.query.year) : undefined;
  const minRating = Number(req.query.minRating) > 0 ? Math.min(9, Number(req.query.minRating)) : undefined;

  const params: Record<string, any> = {
    page,
    sort_by: SORTS[sort][type],
    include_adult: false,
    // Rating and newest sorts are noisy without a vote floor / with unreleased titles.
    'vote_count.gte': sort === 'rating' ? 300 : sort === 'newest' ? 20 : undefined,
    with_genres: genre,
    'vote_average.gte': minRating,
  };
  const today = new Date().toISOString().slice(0, 10);
  if (type === 'movie') {
    if (year) params.primary_release_year = year;
    if (sort === 'newest') params['primary_release_date.lte'] = today;
  } else {
    if (year) params.first_air_date_year = year;
    if (sort === 'newest') params['first_air_date.lte'] = today;
  }
  const key = `discover:${type}:${JSON.stringify(params)}`;
  try {
    res.json(toPage(await tmdbCached(key, TTL.short, `/discover/${type}`, params), type));
  } catch (e) { fail(res, e, 'Discover failed'); }
}

// GET /api/genres/:type
export async function genres(req: Request, res: Response) {
  const type = req.params.type;
  if (!isKind(type)) return res.status(400).json({ message: 'Invalid type' });
  try {
    const data = await tmdbCached<any>(`genres:${type}`, TTL.long, `/genre/${type}/list`);
    res.json(data.genres ?? []);
  } catch (e) { fail(res, e, 'Genres failed'); }
}

// GET /api/search?q=&page=   (movies, shows and people)
export async function search(req: Request, res: Response) {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(400).json({ message: 'Missing q' });
  const page = pageOf(req.query.page);
  try {
    const data = await tmdbCached(`search:${q.toLowerCase()}:${page}`, TTL.short, '/search/multi', { query: q, page, include_adult: false });
    res.json(toPage(data));
  } catch (e) { fail(res, e, 'Search failed'); }
}

// GET /api/movie/:id and /api/tv/:id
export async function details(req: Request, res: Response) {
  const type = req.params.type;
  const id = Number(req.params.id);
  if (!isKind(type)) return res.status(400).json({ message: 'Invalid type' });
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid id' });
  try {
    const append = type === 'movie'
      ? 'credits,videos,watch/providers,recommendations,release_dates'
      : 'aggregate_credits,videos,watch/providers,recommendations,content_ratings';
    const d = await tmdbCached<any>(`details:${type}:${id}`, TTL.long, `/${type}/${id}`, { append_to_response: append });
    res.json(normalizeDetails(type, d));
  } catch (e) { fail(res, e, 'Details failed'); }
}

export function normalizeDetails(type: MediaKind, d: any) {
  const credits = type === 'movie' ? d.credits : d.aggregate_credits;
  const cast = ((credits?.cast ?? []) as any[]).slice(0, 18).map(c => ({
    id: c.id,
    name: c.name,
    character: c.character ?? c.roles?.[0]?.character ?? null,
    profilePath: c.profile_path ?? null,
    episodes: c.total_episode_count ?? undefined,
  }));
  const crew: any[] = (type === 'movie' ? d.credits?.crew : d.created_by) ?? [];
  const directors = type === 'movie'
    ? crew.filter(c => c.job === 'Director').map(c => ({ id: c.id, name: c.name }))
    : crew.map(c => ({ id: c.id, name: c.name }));

  let certification: string | null = null;
  if (type === 'movie') {
    const fr = d.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'FR') ?? d.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
    certification = fr?.release_dates?.find((x: any) => x.certification)?.certification ?? null;
  } else {
    const fr = d.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'FR') ?? d.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
    certification = fr?.rating ?? null;
  }

  const base = {
    id: d.id,
    type,
    title: type === 'movie' ? d.title : d.name,
    originalTitle: type === 'movie' ? d.original_title : d.original_name,
    tagline: d.tagline || null,
    overview: d.overview || null,
    posterPath: d.poster_path ?? null,
    backdropPath: d.backdrop_path ?? null,
    rating: typeof d.vote_average === 'number' ? Math.round(d.vote_average * 10) / 10 : null,
    voteCount: d.vote_count ?? 0,
    genres: (d.genres ?? []) as { id: number; name: string }[],
    certification,
    trailer: pickTrailer(d.videos),
    providers: pickProviders(d['watch/providers']),
    cast,
    directors,
    recommendations: toPage(d.recommendations, type).results.slice(0, 12),
  };

  if (type === 'movie') {
    return {
      ...base,
      date: d.release_date || null,
      year: d.release_date ? Number(d.release_date.slice(0, 4)) : null,
      runtime: d.runtime ?? null,
      status: d.status ?? null,
    };
  }
  return {
    ...base,
    date: d.first_air_date || null,
    year: d.first_air_date ? Number(d.first_air_date.slice(0, 4)) : null,
    runtime: episodeRuntime(d),
    status: d.status ?? null,
    inProduction: !!d.in_production,
    networks: (d.networks ?? []).map((n: any) => ({ id: n.id, name: n.name, logoPath: n.logo_path ?? null })),
    airedEpisodes: airedEpisodes(d),
    nextEpisode: d.next_episode_to_air
      ? { season: d.next_episode_to_air.season_number, episode: d.next_episode_to_air.episode_number, airDate: d.next_episode_to_air.air_date, name: d.next_episode_to_air.name }
      : null,
    seasons: ((d.seasons ?? []) as any[])
      .filter(s => s.season_number > 0)
      .map(s => ({ number: s.season_number, name: s.name, episodeCount: s.episode_count, airDate: s.air_date, posterPath: s.poster_path ?? null })),
  };
}

// GET /api/tv/:id/season/:n
export async function season(req: Request, res: Response) {
  const id = Number(req.params.id);
  const n = Number(req.params.n);
  if (!Number.isInteger(id) || !Number.isInteger(n) || n < 0) return res.status(400).json({ message: 'Invalid id' });
  try {
    const s = await getSeason(id, n);
    res.json(s);
  } catch (e) { fail(res, e, 'Season failed'); }
}

export async function getSeason(id: number, n: number) {
  const s = await tmdbCached<any>(`season:${id}:${n}`, TTL.medium, `/tv/${id}/season/${n}`);
  return {
    number: s.season_number,
    name: s.name,
    overview: s.overview || null,
    airDate: s.air_date ?? null,
    episodes: ((s.episodes ?? []) as any[]).map(e => ({
      number: e.episode_number,
      name: e.name,
      overview: e.overview || null,
      airDate: e.air_date ?? null,
      runtime: e.runtime ?? null,
      stillPath: e.still_path ?? null,
      rating: typeof e.vote_average === 'number' ? Math.round(e.vote_average * 10) / 10 : null,
    })),
  };
}

// GET /api/person/:id
export async function person(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid id' });
  try {
    const p = await tmdbCached<any>(`person:${id}`, TTL.long, `/person/${id}`, { append_to_response: 'combined_credits' });
    const seen = new Set<string>();
    const credits = ((p.combined_credits?.cast ?? []) as any[])
      .filter(c => c.media_type === 'movie' || c.media_type === 'tv')
      .filter(c => { const k = `${c.media_type}:${c.id}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .map(c => ({ ...toCard(c)!, character: c.character || null, popularity: c.popularity ?? 0 }));
    const knownFor = [...credits].filter(c => c.posterPath).sort((a, b) => b.popularity - a.popularity).slice(0, 8);
    const filmography = [...credits].sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));
    res.json({
      id: p.id,
      name: p.name,
      biography: p.biography || null,
      birthday: p.birthday ?? null,
      deathday: p.deathday ?? null,
      placeOfBirth: p.place_of_birth ?? null,
      profilePath: p.profile_path ?? null,
      department: p.known_for_department ?? null,
      knownFor: knownFor.map(({ popularity, ...c }) => c),
      filmography: filmography.map(({ popularity, ...c }) => c),
    });
  } catch (e) { fail(res, e, 'Person failed'); }
}
