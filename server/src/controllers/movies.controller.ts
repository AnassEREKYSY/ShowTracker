import { Request, Response } from 'express';
import { tmdbGet } from '../tmdb';
import { redis } from '../lib/redis';

const SIX_HOURS = 60 * 60 * 6;
const TEN_MIN = 60 * 10;

export const getMovieById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const cacheKey = `movie:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet(`/movie/${id}`, { append_to_response: 'credits,videos' });
    await redis.set(cacheKey, JSON.stringify(data), 'EX', SIX_HOURS);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to fetch movie' });
  }
};

export const getPopularMovies = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const key = `movies:popular:${page}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet('/movie/popular', { page });
    await redis.set(key, JSON.stringify(data), 'EX', TEN_MIN);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to fetch popular' });
  }
};

export const discoverMovies = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const sort_by = String(req.query.sort_by ?? 'popularity.desc');
    const with_genres = typeof req.query.with_genres === 'string' ? req.query.with_genres : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const key = `movies:discover:${page}:${sort_by}:${with_genres ?? ''}:${year ?? ''}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet('/discover/movie', { page, sort_by, with_genres, ...(year ? { year } : {}) });
    await redis.set(key, JSON.stringify(data), 'EX', TEN_MIN);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to discover' });
  }
};

export const searchMovies = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.status(400).json({ error: 'Missing q' });
    const page = Number(req.query.page ?? 1);

    const key = `movies:search:${q.toLowerCase()}:${page}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet('/search/movie', {
      query: q,
      page,
      include_adult: false,
    });

    await redis.set(key, JSON.stringify(data), 'EX', TEN_MIN);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to search' });
  }
};
