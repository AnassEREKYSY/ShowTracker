import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet } from '../tmdb';
import { MediaType } from '@prisma/client';

const allowedTypes = new Set(['movie','tv']);
const mapType = (t: string) => (t === 'movie' ? MediaType.movie : MediaType.tv);

export async function addWatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    const tmdbId = Number(req.params.tmdbId);
    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });
    if (!Number.isInteger(tmdbId))    return res.status(400).json({ message: 'Invalid tmdbId' });

    let title: string | undefined;
    let posterPath: string | undefined;
    if (typeParam === 'movie') {
      const { data } = await tmdbGet<any>(`/movie/${tmdbId}`);
      title = data.title; posterPath = data.poster_path ?? undefined;
    } else {
      const { data } = await tmdbGet<any>(`/tv/${tmdbId}`);
      title = data.name; posterPath = data.poster_path ?? undefined;
    }

    await prisma.watchlistItem.upsert({
      where: { userId_mediaType_tmdbId: { userId, mediaType: mapType(typeParam), tmdbId } },
      update: { title, posterPath },
      create: { userId, mediaType: mapType(typeParam), tmdbId, title, posterPath },
    });

    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Add watch failed' });
  }
}

export async function removeWatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    const tmdbId = Number(req.params.tmdbId);
    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });
    if (!Number.isInteger(tmdbId))    return res.status(400).json({ message: 'Invalid tmdbId' });

    await prisma.watchlistItem.delete({
      where: { userId_mediaType_tmdbId: { userId, mediaType: mapType(typeParam), tmdbId } },
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Remove watch failed' });
  }
}

export async function listWatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });

    const full = req.query.full === 'true';
    const rows = await prisma.watchlistItem.findMany({
      where: { userId, mediaType: mapType(typeParam) },
      orderBy: { addedAt: 'desc' },
    });

    if (!full) return res.json({ items: rows });

    const details = await Promise.all(rows.map(async r => {
      const path = typeParam === 'movie' ? `/movie/${r.tmdbId}` : `/tv/${r.tmdbId}`;
      return (await tmdbGet<any>(path)).data;
    }));

    return res.json({ items: details });
  } catch {
    return res.status(500).json({ message: 'List watch failed' });
  }
}
