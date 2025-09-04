import type { Request, Response } from 'express';

jest.useFakeTimers().setSystemTime(new Date('2024-01-02T03:04:05.000Z'));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    trending: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));
jest.mock('../../src/tmdb', () => ({
  tmdbGet: jest.fn(),
}));

import { prisma } from '../../src/lib/prisma';
import { tmdbGet } from '../../src/tmdb';
import { getTrending, syncTrending } from '../../src/controllers/trending.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return { query: {}, params: {}, ...opts } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('trending.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getTrending', () => {
    it('400 on invalid mediaType/timeWindow', async () => {
      const req = mockReq({ query: { mediaType: 'person', timeWindow: 'day' } });
      const res = mockRes();
      await getTrending(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns empty items if no latest batch', async () => {
      (prisma.trending.findFirst as jest.Mock).mockResolvedValue(null);
      const req = mockReq({ query: { mediaType: 'movie', timeWindow: 'day' } });
      const res = mockRes();
      await getTrending(req, res);
      expect(res.json).toHaveBeenCalledWith({ items: [] });
    });

    it('returns latest batch with limit clamp (limit=2)', async () => {
      const fetchedAt = new Date('2024-01-01T00:00:00.000Z');
      (prisma.trending.findFirst as jest.Mock).mockResolvedValue({ fetchedAt });
      (prisma.trending.findMany as jest.Mock).mockResolvedValue([{ tmdbId: 1 }, { tmdbId: 2 }]);

      const req = mockReq({ query: { mediaType: 'tv', timeWindow: 'week', limit: '2' } });
      const res = mockRes();

      await getTrending(req, res);

      expect(prisma.trending.findMany).toHaveBeenCalledWith({
        where: { mediaType: 'tv', timeWindow: 'week', fetchedAt },
        orderBy: { rank: 'asc' },
        take: 2,
      });
      expect(res.json).toHaveBeenCalledWith({ items: [{ tmdbId: 1 }, { tmdbId: 2 }] });
    });

    it('limit is capped at 50 (limit=100)', async () => {
      const fetchedAt = new Date('2024-01-01T00:00:00.000Z');
      (prisma.trending.findFirst as jest.Mock).mockResolvedValue({ fetchedAt });
      (prisma.trending.findMany as jest.Mock).mockResolvedValue([]);

      const req = mockReq({ query: { mediaType: 'movie', timeWindow: 'day', limit: '100' } });
      const res = mockRes();

      await getTrending(req, res);

      expect(prisma.trending.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });

    it('500 on unexpected error', async () => {
      (prisma.trending.findFirst as jest.Mock).mockRejectedValue(new Error('db down'));
      const req = mockReq({ query: { mediaType: 'movie', timeWindow: 'day' } });
      const res = mockRes();
      await getTrending(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('syncTrending', () => {
    it('400 on invalid params', async () => {
      const req = mockReq({ query: { mediaType: 'person', timeWindow: 'day' } });
      const res = mockRes();
      await syncTrending(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates records for movies with correct mapping and returns 201', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({
        data: {
          results: [
            { id: 10, title: 'Inception', original_title: 'Inception', poster_path: '/p1.jpg' },
            { id: 11, title: null, original_title: 'Orig T', poster_path: null },
          ],
        },
      });

      const req = mockReq({ query: { mediaType: 'movie', timeWindow: 'day' } });
      const res = mockRes();

      await syncTrending(req, res);

      const expectedDate = new Date('2024-01-02T03:04:05.000Z');

      expect(tmdbGet).toHaveBeenCalledWith('/trending/movie/day');
      expect(prisma.trending.createMany).toHaveBeenCalledWith({
        data: [
          {
            mediaType: 'movie',
            timeWindow: 'day',
            fetchedAt: expectedDate,
            tmdbId: 10,
            rank: 1,
            title: 'Inception',
            posterPath: '/p1.jpg',
          },
          {
            mediaType: 'movie',
            timeWindow: 'day',
            fetchedAt: expectedDate,
            tmdbId: 11,
            rank: 2,
            title: 'Orig T',
            posterPath: null,
          },
        ],
        skipDuplicates: true,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ count: 2, fetchedAt: expectedDate });
    });

    it('uses name/original_name for TV and caps to 50 items', async () => {
      const results = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? 'Show A' : null,
        original_name: `Show ${i + 1}`,
        poster_path: i % 2 ? null : `/p${i + 1}.jpg`,
      }));
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { results } });

      const req = mockReq({ query: { mediaType: 'tv', timeWindow: 'week' } });
      const res = mockRes();

      await syncTrending(req, res);

      const calls = (prisma.trending.createMany as jest.Mock).mock.calls[0][0];
      expect(calls.data).toHaveLength(50);
      expect(calls.data[0]).toEqual(
        expect.objectContaining({ mediaType: 'tv', timeWindow: 'week', tmdbId: 1, rank: 1, title: 'Show A' })
      );
      expect(calls.data[1]).toEqual(
        expect.objectContaining({ title: 'Show 2' }) 
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        count: 50,
        fetchedAt: new Date('2024-01-02T03:04:05.000Z'),
      });
    });

    it('500 when TMDB fails', async () => {
      (tmdbGet as jest.Mock).mockRejectedValue(new Error('tmdb down'));
      const req = mockReq({ query: { mediaType: 'movie', timeWindow: 'day' } });
      const res = mockRes();
      await syncTrending(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
