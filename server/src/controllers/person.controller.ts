import { Request, Response } from 'express';
import { tmdbGet } from '../tmdb';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

const TWELVE_HOURS = 60 * 60 * 12;

export const getPersonById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const cacheKey = `person:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const { data } = await tmdbGet(`/person/${id}`, {
      append_to_response: 'combined_credits'
    });
    await upsertActorAndLinks(data);

    await redis.set(cacheKey, JSON.stringify(data), 'EX', TWELVE_HOURS);
    res.json(data);
  } catch (err: any) {
    res.status(err?.response?.status || 500).json({ error: err?.message || 'Failed to fetch person' });
  }
};

async function upsertActorAndLinks(person: any) {
  const actor = await prisma.actor.upsert({
    where: { tmdbId: Number(person.id) },
    create: {
      tmdbId: Number(person.id),
      name: String(person.name || ''),
      profilePath: person.profile_path ?? null
    },
    update: {
      name: String(person.name || ''),
      profilePath: person.profile_path ?? null
    }
  });

  const cast: any[] = (person.combined_credits?.cast ?? []) as any[];

  const movies = cast.filter(c => c.media_type === 'movie' && c.id);
  const tvs    = cast.filter(c => c.media_type === 'tv' && c.id);

  await prisma.$transaction(async (tx) => {
    for (const movie of movies) {
      await upsertMovieAndLink(movie, actor.id);
    }
    for (const tv of tvs) {
      await upsertTvAndLink(tv, actor.id);
    }
  });
}

function upsertMovieAndLink(credit: any, actorId: string) {
  const tmdbId = Number(credit.id);
  const title  = String(credit.title || credit.original_title || '');
  const releaseDate = credit.release_date ? new Date(credit.release_date) : null;
  const posterPath = credit.poster_path ?? null;
  const backdropPath = credit.backdrop_path ?? null;
  const rating = typeof credit.vote_average === 'number' ? credit.vote_average : null;
  const character = credit.character ?? null;
  const creditOrder = Number.isInteger(credit.order) ? credit.order : null;

  return prisma.$transaction(async (tx: { movie: { upsert: (arg0: { where: { tmdbId: number; }; create: { tmdbId: number; title: string; releaseDate: Date | null; posterPath: any; backdropPath: any; rating: any; }; update: { title: string; releaseDate: Date | null; posterPath: any; backdropPath: any; rating: any; }; }) => any; }; movieActor: { upsert: (arg0: { where: { movieId_actorId: { movieId: any; actorId: string; }; }; create: { movieId: any; actorId: string; character: any; creditOrder: any; }; update: { character: any; creditOrder: any; }; }) => any; }; }) => {
    const movie = await tx.movie.upsert({
      where: { tmdbId },
      create: { tmdbId, title, releaseDate, posterPath, backdropPath, rating },
      update: { title, releaseDate, posterPath, backdropPath, rating }
    });
    await tx.movieActor.upsert({
      where: { movieId_actorId: { movieId: movie.id, actorId } },
      create: { movieId: movie.id, actorId, character, creditOrder },
      update: { character, creditOrder }
    });
  });
}

function upsertTvAndLink(credit: any, actorId: string) {
  const tmdbId = Number(credit.id);
  const name   = String(credit.name || credit.original_name || '');
  const firstAirDate = credit.first_air_date ? new Date(credit.first_air_date) : null;
  const posterPath = credit.poster_path ?? null;
  const backdropPath = credit.backdrop_path ?? null;
  const rating = typeof credit.vote_average === 'number' ? credit.vote_average : null;
  const character = (credit.character ?? credit.roles?.[0]?.character) ?? null;
  const creditOrder = Number.isInteger(credit.order) ? credit.order : null;

  return prisma.$transaction(async (tx: { tVShow: { upsert: (arg0: { where: { tmdbId: number; }; create: { tmdbId: number; name: string; firstAirDate: Date | null; posterPath: any; backdropPath: any; rating: any; }; update: { name: string; firstAirDate: Date | null; posterPath: any; backdropPath: any; rating: any; }; }) => any; }; tVShowActor: { upsert: (arg0: { where: { tvShowId_actorId: { tvShowId: any; actorId: string; }; }; create: { tvShowId: any; actorId: string; character: any; creditOrder: any; }; update: { character: any; creditOrder: any; }; }) => any; }; }) => {
    const tv = await tx.tVShow.upsert({
      where: { tmdbId },
      create: { tmdbId, name, firstAirDate, posterPath, backdropPath, rating },
      update: { name, firstAirDate, posterPath, backdropPath, rating }
    });
    await tx.tVShowActor.upsert({
      where: { tvShowId_actorId: { tvShowId: tv.id, actorId } },
      create: { tvShowId: tv.id, actorId, character, creditOrder },
      update: { character, creditOrder }
    });
  });
}
