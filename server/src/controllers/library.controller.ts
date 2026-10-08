import { Request, Response } from 'express';
import { MediaType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { tmdbCached, TTL } from '../tmdb';
import { normalizeDetails, getSeason } from './catalog.controller';
import { computeStats } from '../services/stats';

const STATUSES = ['planned', 'watching', 'watched', 'dropped'] as const;
type Status = typeof STATUSES[number];
type Kind = 'movie' | 'tv';

const isKind = (v: unknown): v is Kind => v === 'movie' || v === 'tv';
const kindOf = (t: Kind) => (t === 'movie' ? MediaType.movie : MediaType.tv);
const uid = (req: Request) => req.user!.id;

async function loadDetails(type: Kind, id: number) {
  const append = type === 'movie'
    ? 'credits,videos,watch/providers,recommendations,release_dates'
    : 'aggregate_credits,videos,watch/providers,recommendations,content_ratings';
  const d = await tmdbCached<any>(`details:${type}:${id}`, TTL.long, `/${type}/${id}`, { append_to_response: append });
  return normalizeDetails(type, d) as any;
}

/** Metadata stored on the entry so lists and stats never need TMDB. */
async function metadata(type: Kind, id: number) {
  const d = await loadDetails(type, id);
  return {
    title: d.title as string,
    posterPath: d.posterPath as string | null,
    backdropPath: d.backdropPath as string | null,
    year: d.year as number | null,
    runtime: d.runtime as number | null,
    totalEpisodes: type === 'tv' ? (d.airedEpisodes as number) : null,
    genres: (d.genres as { name: string }[]).map(g => g.name),
    cast: (d.cast as { name: string }[]).slice(0, 8).map(c => c.name),
  };
}

function params(req: Request): { type: Kind; id: number } | null {
  const type = req.params.type;
  const id = Number(req.params.id);
  if (!isKind(type) || !Number.isInteger(id) || id <= 0) return null;
  return { type, id };
}

async function episodeCount(userId: string, showTmdbId: number) {
  return prisma.episodeWatch.count({ where: { userId, showTmdbId } });
}

const present = (e: any, watchedEpisodes?: number) => e && ({
  id: e.id,
  type: e.mediaType,
  tmdbId: e.tmdbId,
  title: e.title,
  posterPath: e.posterPath,
  backdropPath: e.backdropPath,
  year: e.year,
  status: (e.status ?? 'planned') as Status,
  rating: e.rating,
  notes: e.notes,
  runtime: e.runtime,
  totalEpisodes: e.totalEpisodes,
  watchedEpisodes: watchedEpisodes ?? undefined,
  genres: e.genres,
  addedAt: e.addedAt,
  updatedAt: e.updatedAt,
  startedAt: e.startedAt,
  watchedAt: e.watchedAt,
});

// GET /api/library?status=&type=
export async function list(req: Request, res: Response) {
  const userId = uid(req);
  const status = STATUSES.includes(req.query.status as Status) ? (req.query.status as Status) : undefined;
  const type = isKind(req.query.type) ? req.query.type : undefined;
  const where: Prisma.WatchlistItemWhereInput = {
    userId,
    mediaType: type ? kindOf(type) : { in: [MediaType.movie, MediaType.tv] },
    ...(status === 'planned' ? { OR: [{ status: 'planned' }, { status: null }] } : status ? { status } : {}),
  };
  const rows = await prisma.watchlistItem.findMany({ where, orderBy: [{ updatedAt: 'desc' }] });

  const showIds = rows.filter(r => r.mediaType === MediaType.tv).map(r => r.tmdbId);
  const counts = showIds.length
    ? await prisma.episodeWatch.groupBy({ by: ['showTmdbId'], where: { userId, showTmdbId: { in: showIds } }, _count: { _all: true } })
    : [];
  const countMap = new Map(counts.map(c => [c.showTmdbId, c._count._all]));
  res.json({ items: rows.map(r => present(r, r.mediaType === MediaType.tv ? countMap.get(r.tmdbId) ?? 0 : undefined)) });
}

// GET /api/library/:type/:id  -> state of one title for the current user
export async function state(req: Request, res: Response) {
  const p = params(req);
  if (!p) return res.status(400).json({ message: 'Invalid type or id' });
  const userId = uid(req);
  const [entry, fav, episodes] = await Promise.all([
    prisma.watchlistItem.findUnique({ where: { userId_mediaType_tmdbId: { userId, mediaType: kindOf(p.type), tmdbId: p.id } } }),
    prisma.favorite.findUnique({ where: { userId_mediaType_tmdbId: { userId, mediaType: kindOf(p.type), tmdbId: p.id } } }),
    p.type === 'tv'
      ? prisma.episodeWatch.findMany({ where: { userId, showTmdbId: p.id }, select: { season: true, episode: true }, orderBy: [{ season: 'asc' }, { episode: 'asc' }] })
      : Promise.resolve(undefined),
  ]);
  res.json({ entry: present(entry, episodes?.length), favorite: !!fav, episodes });
}

// PUT /api/library/:type/:id  { status?, rating?, notes?, watchedAt?, markAllEpisodes? }
export async function upsert(req: Request, res: Response) {
  const p = params(req);
  if (!p) return res.status(400).json({ message: 'Invalid type or id' });
  const userId = uid(req);
  const body = req.body ?? {};

  const data: Prisma.WatchlistItemUncheckedUpdateInput = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return res.status(400).json({ message: 'Invalid status' });
    data.status = body.status;
  }
  if (body.rating !== undefined) {
    if (body.rating !== null && !(Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 10)) {
      return res.status(400).json({ message: 'Rating must be 1 to 10' });
    }
    data.rating = body.rating;
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return res.status(400).json({ message: 'Invalid notes' });
    data.notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  }
  if (body.watchedAt !== undefined) {
    const d = body.watchedAt ? new Date(body.watchedAt) : null;
    if (d && Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid watchedAt' });
    data.watchedAt = d;
  }

  try {
    const key = { userId_mediaType_tmdbId: { userId, mediaType: kindOf(p.type), tmdbId: p.id } };
    const existing = await prisma.watchlistItem.findUnique({ where: key });
    const now = new Date();
    if (data.status === 'watched' && body.watchedAt === undefined && !existing?.watchedAt) data.watchedAt = now;
    if (data.status === 'watching' && !existing?.startedAt) data.startedAt = now;
    // Rating something you have not logged yet means you watched it.
    if (!existing && data.status === undefined) data.status = data.rating ? 'watched' : 'planned';
    if (!existing && data.status === 'watched' && !data.watchedAt) data.watchedAt = now;

    // Refresh stored metadata when the entry is created or older than a day.
    const stale = !existing || now.getTime() - existing.updatedAt.getTime() > 24 * 3600 * 1000 || !existing.genres?.length;
    const meta = stale ? await metadata(p.type, p.id) : {};

    const entry = await prisma.watchlistItem.upsert({
      where: key,
      create: { userId, mediaType: kindOf(p.type), tmdbId: p.id, ...(meta as any), ...(data as any) },
      update: { ...meta, ...data },
    });

    if (p.type === 'tv' && data.status === 'watched' && body.markAllEpisodes) {
      await markAllAired(userId, p.id);
    }
    const count = p.type === 'tv' ? await episodeCount(userId, p.id) : undefined;
    res.json({ entry: present(entry, count) });
  } catch (e: any) {
    res.status(e?.response?.status === 404 ? 404 : 500).json({ message: 'Update failed' });
  }
}

// DELETE /api/library/:type/:id   (also clears episode progress)
export async function remove(req: Request, res: Response) {
  const p = params(req);
  if (!p) return res.status(400).json({ message: 'Invalid type or id' });
  const userId = uid(req);
  await prisma.watchlistItem.deleteMany({ where: { userId, mediaType: kindOf(p.type), tmdbId: p.id } });
  if (p.type === 'tv') await prisma.episodeWatch.deleteMany({ where: { userId, showTmdbId: p.id } });
  res.json({ ok: true });
}

async function markAllAired(userId: string, showId: number) {
  const d = await loadDetails('tv', showId);
  const today = new Date().toISOString().slice(0, 10);
  const rows: Prisma.EpisodeWatchCreateManyInput[] = [];
  for (const s of d.seasons as { number: number }[]) {
    const season = await getSeason(showId, s.number);
    for (const e of season.episodes) {
      if (e.airDate && e.airDate <= today) {
        rows.push({ userId, showTmdbId: showId, season: s.number, episode: e.number, runtime: e.runtime ?? d.runtime ?? null });
      }
    }
  }
  if (rows.length) await prisma.episodeWatch.createMany({ data: rows, skipDuplicates: true });
}

// PUT /api/library/tv/:id/episodes  { season, episodes: number[], watched: boolean }
export async function setEpisodes(req: Request, res: Response) {
  const showId = Number(req.params.id);
  const userId = uid(req);
  const { season, episodes, watched } = req.body ?? {};
  if (!Number.isInteger(showId) || showId <= 0 || !Number.isInteger(season) || season < 1
    || !Array.isArray(episodes) || !episodes.length || episodes.some((n: unknown) => !Number.isInteger(n) || (n as number) < 1)
    || typeof watched !== 'boolean') {
    return res.status(400).json({ message: 'Expected { season, episodes: number[], watched: boolean }' });
  }

  try {
    if (watched) {
      const s = await getSeason(showId, season);
      const runtimes = new Map(s.episodes.map(e => [e.number, e.runtime]));
      await prisma.episodeWatch.createMany({
        data: episodes.map((n: number) => ({ userId, showTmdbId: showId, season, episode: n, runtime: runtimes.get(n) ?? null })),
        skipDuplicates: true,
      });
    } else {
      await prisma.episodeWatch.deleteMany({ where: { userId, showTmdbId: showId, season, episode: { in: episodes } } });
    }

    // Keep the show's status in line with the progress.
    const key = { userId_mediaType_tmdbId: { userId, mediaType: MediaType.tv, tmdbId: showId } };
    let entry = await prisma.watchlistItem.findUnique({ where: key });
    const count = await episodeCount(userId, showId);
    const now = new Date();
    if (!entry && count > 0) {
      entry = await prisma.watchlistItem.create({
        data: { userId, mediaType: MediaType.tv, tmdbId: showId, status: 'watching', startedAt: now, ...(await metadata('tv', showId)) },
      });
    }
    if (entry) {
      const total = entry.totalEpisodes ?? 0;
      const current = entry.status ?? 'planned';
      let next = current;
      if (total > 0 && count >= total) next = 'watched';
      else if (count > 0 && (current === 'planned' || current === 'watched')) next = 'watching';
      if (next !== current) {
        entry = await prisma.watchlistItem.update({
          where: key,
          data: {
            status: next,
            startedAt: entry.startedAt ?? now,
            watchedAt: next === 'watched' ? now : entry.watchedAt,
          },
        });
      }
    }
    const list = await prisma.episodeWatch.findMany({
      where: { userId, showTmdbId: showId }, select: { season: true, episode: true }, orderBy: [{ season: 'asc' }, { episode: 'asc' }],
    });
    res.json({ entry: present(entry, count), episodes: list });
  } catch (e: any) {
    res.status(e?.response?.status === 404 ? 404 : 500).json({ message: 'Update failed' });
  }
}

// GET /api/library/up-next  -> next episode of each show in progress
export async function upNext(req: Request, res: Response) {
  const userId = uid(req);
  const shows = await prisma.watchlistItem.findMany({
    where: { userId, mediaType: MediaType.tv, status: 'watching' },
    orderBy: { updatedAt: 'desc' },
    take: 12,
  });
  const today = new Date().toISOString().slice(0, 10);

  const items = await Promise.all(shows.map(async show => {
    try {
      const [d, watched] = await Promise.all([
        loadDetails('tv', show.tmdbId),
        prisma.episodeWatch.findMany({ where: { userId, showTmdbId: show.tmdbId }, select: { season: true, episode: true } }),
      ]);
      const done = new Set(watched.map(w => `${w.season}:${w.episode}`));
      for (const s of d.seasons as { number: number; episodeCount: number }[]) {
        const missing = Array.from({ length: s.episodeCount }, (_, i) => i + 1).find(n => !done.has(`${s.number}:${n}`));
        if (!missing) continue;
        const season = await getSeason(show.tmdbId, s.number);
        const ep = season.episodes.find(e => e.number === missing);
        if (!ep || !ep.airDate || ep.airDate > today) return null; // caught up, waiting for new episodes
        return {
          show: { tmdbId: show.tmdbId, title: show.title, posterPath: show.posterPath, backdropPath: show.backdropPath },
          season: s.number,
          episode: ep.number,
          name: ep.name,
          stillPath: ep.stillPath,
          airDate: ep.airDate,
          runtime: ep.runtime,
          watchedEpisodes: watched.length,
          totalEpisodes: show.totalEpisodes,
        };
      }
      return null;
    } catch { return null; }
  }));
  res.json({ items: items.filter(Boolean) });
}

// GET /api/diary?limit=60  -> what you watched, most recent first
export async function diary(req: Request, res: Response) {
  const userId = uid(req);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 60));
  const [movies, episodes] = await Promise.all([
    prisma.watchlistItem.findMany({
      where: { userId, mediaType: MediaType.movie, status: 'watched', watchedAt: { not: null } },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    }),
    prisma.episodeWatch.findMany({ where: { userId }, orderBy: { watchedAt: 'desc' }, take: limit * 8 }),
  ]);

  // Episodes of the same show on the same day become one diary line.
  const groups = new Map<string, { showTmdbId: number; day: string; at: Date; episodes: { season: number; episode: number }[]; minutes: number }>();
  for (const e of episodes) {
    const day = e.watchedAt.toISOString().slice(0, 10);
    const k = `${e.showTmdbId}:${day}`;
    const g = groups.get(k) ?? { showTmdbId: e.showTmdbId, day, at: e.watchedAt, episodes: [], minutes: 0 };
    g.episodes.push({ season: e.season, episode: e.episode });
    g.minutes += e.runtime ?? 40;
    groups.set(k, g);
  }
  const showIds = [...new Set([...groups.values()].map(g => g.showTmdbId))];
  const shows = showIds.length
    ? await prisma.watchlistItem.findMany({ where: { userId, mediaType: MediaType.tv, tmdbId: { in: showIds } } })
    : [];
  const showMap = new Map(shows.map(s => [s.tmdbId, s]));

  const events = [
    ...movies.map(m => ({
      kind: 'movie' as const,
      at: m.watchedAt!,
      tmdbId: m.tmdbId,
      title: m.title,
      posterPath: m.posterPath,
      year: m.year,
      rating: m.rating,
      notes: m.notes,
      minutes: m.runtime ?? 0,
    })),
    ...[...groups.values()].map(g => {
      const s = showMap.get(g.showTmdbId);
      g.episodes.sort((a, b) => a.season - b.season || a.episode - b.episode);
      return {
        kind: 'episodes' as const,
        at: g.at,
        tmdbId: g.showTmdbId,
        title: s?.title ?? 'TV show',
        posterPath: s?.posterPath ?? null,
        year: s?.year ?? null,
        rating: null,
        notes: null,
        minutes: g.minutes,
        episodes: g.episodes,
      };
    }),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);

  res.json({ items: events });
}

// GET /api/stats
export async function stats(req: Request, res: Response) {
  const userId = uid(req);
  const [entries, episodes] = await Promise.all([
    prisma.watchlistItem.findMany({
      where: { userId },
      select: { mediaType: true, status: true, rating: true, runtime: true, watchedAt: true, genres: true, cast: true },
    }),
    prisma.episodeWatch.findMany({ where: { userId }, select: { runtime: true, watchedAt: true } }),
  ]);
  res.json(computeStats(entries as any, episodes));
}
