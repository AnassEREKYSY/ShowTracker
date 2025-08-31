import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet, TmdbPaged, TmdbTrendingItem } from '../tmdb';

type MediaType = 'movie' | 'tv';
type TimeWindow = 'day' | 'week';

export const getTrending = async (req: Request, res: Response) => {
  const mediaType = (req.query.mediaType as MediaType) ?? 'movie';
  const timeWindow = (req.query.timeWindow as TimeWindow) ?? 'day';

  const rows = await prisma.trending.findMany({
    where: { mediaType, timeWindow },
    orderBy: [{ fetchedAt: 'desc' }, { rank: 'asc' }],
    take: 50
  });

  res.json(rows);
};

export const syncTrending = async (req: Request, res: Response) => {
  const mediaType = (req.query.mediaType as MediaType) ?? 'movie';
  const timeWindow = (req.query.timeWindow as TimeWindow) ?? 'day';

  // 👉 Tell TS the exact response shape:
  const { data } = await tmdbGet<TmdbPaged<TmdbTrendingItem>>(
    `/trending/${mediaType}/${timeWindow}`,
    { page: 1 }
  );

  const fetchedAt = new Date();
  const rows = data.results.slice(0, 50).map((it, idx) => ({
    mediaType,
    tmdbId: it.id,
    rank: idx + 1,
    timeWindow,
    fetchedAt,
    title: mediaType === 'movie'
      ? (it.title ?? it.original_title ?? null)
      : (it.name ?? it.original_name ?? null),
    posterPath: it.poster_path ?? null
  }));

  await prisma.trending.createMany({ data: rows, skipDuplicates: true });
  await prisma.trending.deleteMany({
    where: { fetchedAt: { lt: new Date(Date.now() - 14 * 24 * 3600 * 1000) } }
  });

  res.status(201).json({ count: rows.length, mediaType, timeWindow, fetchedAt });
};
