import type { Request, Response } from 'express';

jest.mock('../../src/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));
jest.mock('../../src/tmdb', () => ({
  tmdbGet: jest.fn(),
}));

import { redis } from '../../src/lib/redis';
import { tmdbGet } from '../../src/tmdb';
import {
  getMovieById,
  getPopularMovies,
  discoverMovies,
  searchMovies,
} from '../../src/controllers/movies.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return { params: {}, query: {}, ...opts } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('movies.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getMovieById', () => {
    it('400 invalid id', async () => {
      const req = mockReq({ params: { id: 'abc' } });
      const res = mockRes();
      await getMovieById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('serves from cache when present', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: 1, t: 'cached' }));
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await getMovieById(req, res);
      expect(redis.get).toHaveBeenCalledWith('movie:1');
      expect(res.json).toHaveBeenCalledWith({ id: 1, t: 'cached' });
      expect(tmdbGet).not.toHaveBeenCalled();
    });

    it('fetches and caches when missing', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { id: 2, title: 'X' } });

      const req = mockReq({ params: { id: '2' } });
      const res = mockRes();
      await getMovieById(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/movie/2', { append_to_response: 'credits,videos' });
      expect(redis.set).toHaveBeenCalledWith('movie:2', JSON.stringify({ id: 2, title: 'X' }), 'EX', 21600);
      expect(res.json).toHaveBeenCalledWith({ id: 2, title: 'X' });
    });
  });

  describe('getPopularMovies', () => {
    it('serves cached page', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ page: 1, results: [1] }));
      const req = mockReq({ query: { page: '1' } });
      const res = mockRes();
      await getPopularMovies(req, res);
      expect(res.json).toHaveBeenCalledWith({ page: 1, results: [1] });
    });

    it('fetches and caches when missing', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { page: 2, results: [1, 2] } });
      const req = mockReq({ query: { page: '2' } });
      const res = mockRes();
      await getPopularMovies(req, res);
      expect(tmdbGet).toHaveBeenCalledWith('/movie/popular', { page: 2 });
      expect(redis.set).toHaveBeenCalledWith('movies:popular:2', JSON.stringify({ page: 2, results: [1, 2] }), 'EX', 600);
      expect(res.json).toHaveBeenCalledWith({ page: 2, results: [1, 2] });
    });
  });

  describe('discoverMovies', () => {
    it('uses all query params in key and request; caches 10min', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { page: 2, results: [] } });

      const req = mockReq({ query: {
        page: '2',
        sort_by: 'vote_average.desc',
        with_genres: '28',
        year: '2010',
      } });
      const res = mockRes();

      await discoverMovies(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/discover/movie', {
        page: 2, sort_by: 'vote_average.desc', with_genres: '28', year: 2010,
      });
      expect(redis.set).toHaveBeenCalledWith(
        'movies:discover:2:vote_average.desc:28:2010',
        JSON.stringify({ page: 2, results: [] }),
        'EX',
        600
      );
      expect(res.json).toHaveBeenCalledWith({ page: 2, results: [] });
    });
  });

  describe('searchMovies', () => {
    it('400 when q missing', async () => {
      const req = mockReq({ query: { q: '   ' } });
      const res = mockRes();
      await searchMovies(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('searches, caches by lowercased key', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { page: 3, results: [{ id: 1 }] } });

      const req = mockReq({ query: { q: 'Batman', page: '3' } });
      const res = mockRes();

      await searchMovies(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/search/movie', {
        query: 'Batman', page: 3, include_adult: false,
      });
      expect(redis.set).toHaveBeenCalledWith(
        'movies:search:batman:3',
        JSON.stringify({ page: 3, results: [{ id: 1 }] }),
        'EX',
        600
      );
      expect(res.json).toHaveBeenCalledWith({ page: 3, results: [{ id: 1 }] });
    });
  });
});
