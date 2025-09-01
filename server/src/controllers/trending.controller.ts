import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet, TmdbPaged, TmdbTrendingItem } from '../tmdb';
import { MediaType, TimeWindow } from '@prisma/client';

const mediaSet = new Set(['movie','tv']);
const windowSet = new Set(['day','week']);
const mt = (v: string): MediaType => (v === 'movie' ? MediaType.movie : MediaType.tv);
const tw = (v: string): TimeWindow => (v === 'day' ? TimeWindow.day : TimeWindow.week);

export async function getTrending(req: Request, res: Response) {
  try {
    const mediaType = String(req.query.mediaType || 'movie').toLowerCase();
    const timeWindow = String(req.query.timeWindow || 'day').toLowerCase();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    if (!mediaSet.has(mediaType) || !windowSet.has(timeWindow))
      return res.status(400).json({ message: 'Invalid mediaType or timeWindow' });

    const latest = await prisma.trending.findFirst({
      where: { mediaType: mt(mediaType), timeWindow: tw(timeWindow) },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });
    if (!latest) return res.json({ items: [] });

    const items = await prisma.trending.findMany({
      where: { mediaType: mt(mediaType), timeWindow: tw(timeWindow), fetchedAt: latest.fetchedAt },
      orderBy: { rank: 'asc' },
      take: limit,
    });

    return res.json({ items });
  } catch {
    return res.status(500).json({ message: 'Trending failed' });
  }
}

export async function syncTrending(req: Request, res: Response) {
  try {
    const mediaType = String(req.query.mediaType || 'movie').toLowerCase();
    const timeWindow = String(req.query.timeWindow || 'day').toLowerCase();
    if (!mediaSet.has(mediaType) || !windowSet.has(timeWindow))
      return res.status(400).json({ message: 'Invalid mediaType or timeWindow' });

    const { data } = await tmdbGet<TmdbPaged<TmdbTrendingItem>>(`/trending/${mediaType}/${timeWindow}`);
    const results = data.results ?? [];

    const now = new Date();
    const records = results.slice(0, 50).map((r, i) => ({
      mediaType: mt(mediaType),
      timeWindow: tw(timeWindow),
      fetchedAt: now,
      tmdbId: r.id,
      rank: i + 1,
      title: mediaType === 'movie' ? (r.title ?? r.original_title) : (r.name ?? r.original_name),
      posterPath: r.poster_path ?? null,
    }));

    await prisma.trending.createMany({ data: records, skipDuplicates: true });

    return res.status(201).json({ count: records.length, fetchedAt: now });
  } catch {
    return res.status(500).json({ message: 'Sync trending failed' });
  }
}
