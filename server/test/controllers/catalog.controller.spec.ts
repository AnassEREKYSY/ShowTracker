import type { Request, Response } from 'express';

jest.mock('../../src/tmdb', () => ({
  tmdbCached: jest.fn(),
  TTL: { short: 1, medium: 1, long: 1 },
  WATCH_REGION: 'FR',
}));
jest.mock('../../src/lib/redis', () => ({ redis: {} }));

import { tmdbCached } from '../../src/tmdb';
import { details, discover, search, trending } from '../../src/controllers/catalog.controller';

const req = (o: any = {}) => ({ params: {}, query: {}, ...o }) as Request;
function res() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r as Response & { status: jest.Mock; json: jest.Mock };
}

describe('catalog.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('trending drops people', async () => {
    (tmdbCached as jest.Mock).mockResolvedValue({ page: 1, results: [
      { id: 1, media_type: 'movie', title: 'M' }, { id: 2, media_type: 'person', name: 'P' },
    ] });
    const r = res();
    await trending(req({ query: { type: 'all' } }), r);
    expect(r.json.mock.calls[0][0].results.map((x: any) => x.id)).toEqual([1]);
  });

  it('search needs a query', async () => {
    const r = res();
    await search(req(), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  it('discover maps filters to TMDB params', async () => {
    (tmdbCached as jest.Mock).mockResolvedValue({ page: 1, results: [] });
    await discover(req({ params: { type: 'tv' }, query: { genre: '18', year: '2020', minRating: '7', sort: 'rating' } }), res());
    const params = (tmdbCached as jest.Mock).mock.calls[0][3];
    expect((tmdbCached as jest.Mock).mock.calls[0][2]).toBe('/discover/tv');
    expect(params).toMatchObject({ with_genres: '18', first_air_date_year: 2020, 'vote_average.gte': 7, sort_by: 'vote_average.desc', 'vote_count.gte': 300 });
  });

  it('discover rejects an unknown type', async () => {
    const r = res();
    await discover(req({ params: { type: 'person' } }), r);
    expect(r.status).toHaveBeenCalledWith(400);
  });

  it('details returns 404 when TMDB does', async () => {
    (tmdbCached as jest.Mock).mockRejectedValue({ response: { status: 404 } });
    const r = res();
    await details(req({ params: { type: 'movie', id: '5' } }), r);
    expect(r.status).toHaveBeenCalledWith(404);
  });

  it('details normalizes a movie', async () => {
    (tmdbCached as jest.Mock).mockResolvedValue({
      id: 5, title: 'T', release_date: '2019-05-01', runtime: 120, genres: [{ id: 18, name: 'Drama' }],
      credits: { cast: [{ id: 9, name: 'Actor', character: 'Hero' }], crew: [{ id: 3, name: 'Dir', job: 'Director' }] },
      videos: { results: [{ site: 'YouTube', key: 'k', type: 'Trailer', official: true, name: 'Trailer' }] },
      'watch/providers': { results: { FR: { flatrate: [{ provider_id: 8, provider_name: 'Netflix' }] } } },
      recommendations: { results: [] },
    });
    const r = res();
    await details(req({ params: { type: 'movie', id: '5' } }), r);
    expect(r.json.mock.calls[0][0]).toMatchObject({
      id: 5, type: 'movie', year: 2019, runtime: 120, trailer: { key: 'k' },
      directors: [{ name: 'Dir' }], cast: [{ name: 'Actor', character: 'Hero' }],
      providers: { region: 'FR', stream: [{ name: 'Netflix' }] },
    });
  });
});
