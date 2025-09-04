import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    favorite: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));
jest.mock('../../src/tmdb', () => ({
  tmdbGet: jest.fn(),
}));

import { prisma } from '../../src/lib/prisma';
import { tmdbGet } from '../../src/tmdb';
import { addFavorite, removeFavorite, listFavorites } from '../../src/controllers/favorites.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return { params: {}, query: {}, headers: {}, ...opts } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('favorites.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('addFavorite', () => {
    it('400 for invalid type', async () => {
      const req = mockReq({ params: { type: 'book', tmdbId: '1' } });
      (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('400 for invalid tmdbId', async () => {
      const req = mockReq({ params: { type: 'movie', tmdbId: 'NaN' } });
      (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('201 adds movie favorite (uses title/poster_path)', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { title: 'Inception', poster_path: '/p.jpg' } });

      const req = mockReq({ params: { type: 'movie', tmdbId: '550' } });
      (req as any).user = { id: 'u1' };
      const res = mockRes();

      await addFavorite(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/movie/550');
      expect(prisma.favorite.upsert).toHaveBeenCalledWith({
        where: { userId_mediaType_tmdbId: { userId: 'u1', mediaType: 'movie', tmdbId: 550 } },
        update: { title: 'Inception', posterPath: '/p.jpg' },
        create: { userId: 'u1', mediaType: 'movie', tmdbId: 550, title: 'Inception', posterPath: '/p.jpg' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('supports tv and person mapping', async () => {
      (tmdbGet as jest.Mock)
        .mockResolvedValueOnce({ data: { name: 'Breaking Bad', poster_path: '/tv.jpg' } }) // tv
        .mockResolvedValueOnce({ data: { name: 'Keanu Reeves', profile_path: '/pp.jpg' } }); // person

      const tvReq = mockReq({ params: { type: 'tv', tmdbId: '1396' } }); (tvReq as any).user = { id: 'u1' };
      const personReq = mockReq({ params: { type: 'person', tmdbId: '6384' } }); (personReq as any).user = { id: 'u1' };
      const res = mockRes();

      await addFavorite(tvReq, res);
      await addFavorite(personReq, res);

      expect(tmdbGet).toHaveBeenNthCalledWith(1, '/tv/1396');
      expect(tmdbGet).toHaveBeenNthCalledWith(2, '/person/6384');

      expect(prisma.favorite.upsert).toHaveBeenCalledTimes(2);
    });

    it('500 on unexpected error', async () => {
      (tmdbGet as jest.Mock).mockRejectedValue(new Error('tmdb down'));
      const req = mockReq({ params: { type: 'movie', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removeFavorite', () => {
    it('400 invalid type', async () => {
      const req = mockReq({ params: { type: 'x', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('400 invalid tmdbId', async () => {
      const req = mockReq({ params: { type: 'movie', tmdbId: 'bad' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('200 removes favorite by composite key', async () => {
      const req = mockReq({ params: { type: 'movie', tmdbId: '550' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeFavorite(req, res);
      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_mediaType_tmdbId: { userId: 'u1', mediaType: 'movie', tmdbId: 550 } },
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('500 on unexpected error', async () => {
      (prisma.favorite.delete as jest.Mock).mockRejectedValue(new Error('db'));
      const req = mockReq({ params: { type: 'movie', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeFavorite(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listFavorites', () => {
    it('400 for invalid type', async () => {
      const req = mockReq({ params: { type: 'xxx' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await listFavorites(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns rows when full=false', async () => {
      const rows = [{ tmdbId: 1 }, { tmdbId: 2 }];
      (prisma.favorite.findMany as jest.Mock).mockResolvedValue(rows);
      const req = mockReq({ params: { type: 'movie' }, query: { full: 'false' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await listFavorites(req, res);
      expect(res.json).toHaveBeenCalledWith({ items: rows });
    });

    it('fetches TMDB details when full=true', async () => {
      const rows = [{ tmdbId: 1 }, { tmdbId: 2 }];
      (prisma.favorite.findMany as jest.Mock).mockResolvedValue(rows);
      (tmdbGet as jest.Mock)
        .mockResolvedValueOnce({ data: { id: 1, title: 'A' } })
        .mockResolvedValueOnce({ data: { id: 2, title: 'B' } });

      const req = mockReq({ params: { type: 'movie' }, query: { full: 'true' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await listFavorites(req, res);

      expect(tmdbGet).toHaveBeenNthCalledWith(1, '/movie/1');
      expect(tmdbGet).toHaveBeenNthCalledWith(2, '/movie/2');
      expect(res.json).toHaveBeenCalledWith({ items: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] });
    });

    it('500 on unexpected error', async () => {
      (prisma.favorite.findMany as jest.Mock).mockRejectedValue(new Error('db'));
      const req = mockReq({ params: { type: 'movie' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await listFavorites(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
