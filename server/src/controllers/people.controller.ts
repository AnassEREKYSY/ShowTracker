import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tmdbGet } from '../tmdb';

export async function searchPeople(req: Request, res: Response) {
  try {
    const q = String(req.query.q || '').trim();
    const page = Number(req.query.page || 1);
    if (!q) return res.status(400).json({ message: 'q required' });

    const { data } = await tmdbGet<any>('/search/person', { query: q, include_adult: false, page });
    return res.json({ items: data.results ?? [], page: data.page, totalPages: data.total_pages });
  } catch {
    return res.status(500).json({ message: 'Search people failed' });
  }
}

export async function getPerson(req: Request, res: Response) {
  try {
    const tmdbId = Number(req.params.tmdbId);
    if (!Number.isInteger(tmdbId)) return res.status(400).json({ message: 'Invalid person id' });

    const { data } = await tmdbGet<any>(`/person/${tmdbId}`, { append_to_response: 'combined_credits' });

    await prisma.actor.upsert({
      where: { tmdbId },
      update: { name: data.name, profilePath: data.profile_path ?? null },
      create: { tmdbId, name: data.name, profilePath: data.profile_path ?? null },
    });

    return res.json(data);
  } catch {
    return res.status(500).json({ message: 'Get person failed' });
  }
}
