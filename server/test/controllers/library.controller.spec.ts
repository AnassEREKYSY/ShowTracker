import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    watchlistItem: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
    episodeWatch: { count: jest.fn(), findMany: jest.fn() },
  },
}));
jest.mock('../../src/tmdb', () => ({ tmdbCached: jest.fn(), TTL: { short: 1, medium: 1, long: 1 }, WATCH_REGION: 'FR' }));
jest.mock('../../src/lib/redis', () => ({ redis: {} }));

import { prisma } from '../../src/lib/prisma';
import { tmdbCached } from '../../src/tmdb';
import { setEpisodes, stats, upsert } from '../../src/controllers/library.controller';

const req = (o: any = {}) => ({ params: {}, query: {}, body: {}, user: { id: 'u1' }, ...o }) as unknown as Request;
function res() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r as Response & { status: jest.Mock; json: jest.Mock };
}
const p = prisma as any;

describe('library.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [{ status: 'seen' }],
    [{ rating: 11 }],
    [{ rating: 4.5 }],
    [{ watchedAt: 'not a date' }],
  ])('rejects invalid body %j', async body => {
    const r = res();
    await upsert(req({ params: { type: 'movie', id: '1' }, body }), r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(p.watchlistItem.upsert).not.toHaveBeenCalled();
  });

  it('rating a new title logs it as watched with metadata', async () => {
    p.watchlistItem.findUnique.mockResolvedValue(null);
    p.watchlistItem.upsert.mockImplementation(({ create }: any) => ({ ...create, id: 'e1', addedAt: new Date(), updatedAt: new Date() }));
    (tmdbCached as jest.Mock).mockResolvedValue({
      id: 1, title: 'Film', release_date: '2001-01-01', runtime: 99, genres: [{ id: 1, name: 'Drama' }],
      credits: { cast: [{ id: 2, name: 'Star' }], crew: [] }, recommendations: { results: [] },
    });
    const r = res();
    await upsert(req({ params: { type: 'movie', id: '1' }, body: { rating: 9 } }), r);
    const create = p.watchlistItem.upsert.mock.calls[0][0].create;
    expect(create).toMatchObject({ status: 'watched', rating: 9, title: 'Film', runtime: 99, genres: ['Drama'], cast: ['Star'] });
    expect(create.watchedAt).toBeInstanceOf(Date);
    expect(r.json.mock.calls[0][0].entry.status).toBe('watched');
  });

  it('validates episode updates', async () => {
    const r = res();
    await setEpisodes(req({ params: { id: '5' }, body: { season: 1, episodes: [0], watched: true } }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  it('stats reads the user data only', async () => {
    p.watchlistItem.findMany.mockResolvedValue([]);
    p.episodeWatch.findMany.mockResolvedValue([]);
    const r = res();
    await stats(req(), r);
    expect(p.watchlistItem.findMany.mock.calls[0][0].where).toEqual({ userId: 'u1' });
    expect(r.json.mock.calls[0][0].totals.minutes).toBe(0);
  });
});
