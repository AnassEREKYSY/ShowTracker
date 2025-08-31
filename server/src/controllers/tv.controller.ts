import { Request, Response } from 'express';
import { tmdbGet } from '../tmdb';
import { redis } from '../lib/redis';

const SIX_HOURS = 60 * 60 * 6;
const TEN_MIN = 60 * 10;

// GET /api/tv/:id  (details + credits + videos)
export const getTvById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const key = `tv:${id}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet(`/tv/${id}`, { append_to_response: 'credits,videos' });
    await redis.set(key, JSON.stringify(data), 'EX', SIX_HOURS);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to fetch TV show' });
  }
};

// GET /api/tv/popular?page=1
export const getPopularTv = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const key = `tv:popular:${page}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet('/tv/popular', { page });
    await redis.set(key, JSON.stringify(data), 'EX', TEN_MIN);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to fetch popular TV' });
  }
};

// GET /api/tv/discover?page=1&sort_by=popularity.desc&with_genres=18&first_air_date_year=2024
export const discoverTv = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const sort_by = String(req.query.sort_by ?? 'popularity.desc');
    const with_genres = typeof req.query.with_genres === 'string' ? req.query.with_genres : undefined; // comma-separated TMDB genre ids
    const first_air_date_year = req.query.first_air_date_year ? Number(req.query.first_air_date_year) : undefined;

    const key = `tv:discover:${page}:${sort_by}:${with_genres ?? ''}:${first_air_date_year ?? ''}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const { data } = await tmdbGet('/discover/tv', {
      page,
      sort_by,
      with_genres,
      ...(first_air_date_year ? { first_air_date_year } : {})
    });

    await redis.set(key, JSON.stringify(data), 'EX', TEN_MIN);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to discover TV' });
  }
};
