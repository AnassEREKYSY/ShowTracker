import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet } from '../tmdb'; 
import { MediaType } from '@prisma/client';

const allowedTypes = new Set(['movie','tv','person']);

function mapType(t: string): MediaType {
  if (t === 'movie') return MediaType.movie;
  if (t === 'tv')    return MediaType.tv;
  if (t === 'person') return MediaType.person;
  throw new Error('Invalid type');
}

export async function addFavorite(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    const tmdbId = Number(req.params.tmdbId);

    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });
    if (!Number.isInteger(tmdbId))    return res.status(400).json({ message: 'Invalid tmdbId' });

    // hydrate title + poster/profile for quick lists
    let title: string | undefined;
    let posterPath: string | undefined;

    if (typeParam === 'movie') {
      const { data } = await tmdbGet<any>(`/movie/${tmdbId}`);
      title = data.title; posterPath = data.poster_path ?? undefined;
    } else if (typeParam === 'tv') {
      const { data } = await tmdbGet<any>(`/tv/${tmdbId}`);
      title = data.name; posterPath = data.poster_path ?? undefined;
    } else { // person
      const { data } = await tmdbGet<any>(`/person/${tmdbId}`);
      title = data.name; posterPath = data.profile_path ?? undefined;
    }

    await prisma.favorite.upsert({
      where: {
        userId_mediaType_tmdbId: { userId, mediaType: mapType(typeParam), tmdbId }
      },
      update: { title, posterPath },
      create: { userId, mediaType: mapType(typeParam), tmdbId, title, posterPath },
    });

    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Add favorite failed' });
  }
}

export async function removeFavorite(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    const tmdbId = Number(req.params.tmdbId);

    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });
    if (!Number.isInteger(tmdbId))    return res.status(400).json({ message: 'Invalid tmdbId' });

    await prisma.favorite.delete({
      where: {
        userId_mediaType_tmdbId: { userId, mediaType: mapType(typeParam), tmdbId }
      },
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Remove favorite failed' });
  }
}

export async function listFavorites(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id as string;
    const typeParam = String(req.params.type);
    if (!allowedTypes.has(typeParam)) return res.status(400).json({ message: 'Invalid type' });

    const full = req.query.full === 'true';
    const rows = await prisma.favorite.findMany({
      where: { userId, mediaType: mapType(typeParam) },
      orderBy: { createdAt: 'desc' },
    });

    if (!full) return res.json({ items: rows });

    const details = await Promise.all(rows.map(async r => {
      if (typeParam === 'movie') return (await tmdbGet<any>(`/movie/${r.tmdbId}`)).data;
      if (typeParam === 'tv')    return (await tmdbGet<any>(`/tv/${r.tmdbId}`)).data;
      return (await tmdbGet<any>(`/person/${r.tmdbId}`)).data;
    }));

    return res.json({ items: details });
  } catch {
    return res.status(500).json({ message: 'List favorites failed' });
  }
}
