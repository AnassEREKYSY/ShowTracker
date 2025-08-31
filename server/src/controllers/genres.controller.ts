import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet } from '../tmdb';

type TmdbGenre = { id: number; name: string };

export const getGenres = async (_req: Request, res: Response) => {
  const rows = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
  res.json(rows);
};

export const syncGenres = async (_req: Request, res: Response) => {
  const [movieRes, tvRes] = await Promise.all([
    tmdbGet<{ genres: TmdbGenre[] }>('/genre/movie/list', { language: 'en-US' }),
    tmdbGet<{ genres: TmdbGenre[] }>('/genre/tv/list', { language: 'en-US' }),
  ]);

  const merged = [...(movieRes.data.genres || []), ...(tvRes.data.genres || [])];
  const byId = new Map<number, string>();
  for (const g of merged) {
    byId.set(g.id, g.name);
  }
  const genres = Array.from(byId, ([id, name]) => ({ id, name }));
  await prisma.$transaction(
    genres.map((g) =>
      prisma.genre.upsert({
        where: { tmdbId: g.id },
        create: { tmdbId: g.id, name: g.name },
        update: { name: g.name },
      })
    )
  );

  const rows = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
  res.status(201).json({ count: rows.length, genres: rows });
};
