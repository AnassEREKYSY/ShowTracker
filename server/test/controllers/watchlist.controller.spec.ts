import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    watchlistItem: {
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
import { addWatch, removeWatch, listWatch } from '../../src/controllers/watchlist.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return { params: {}, query: {}, headers: {}, ...opts } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('watchlist.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('addWatch', () => {
    it('400 invalid type', async () => {
      const req = mockReq({ params: { type: 'person', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('400 invalid tmdbId', async () => {
      const req = mockReq({ params: { type: 'movie', tmdbId: 'abc' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('201 adds movie with title/poster', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { title: 'Inception', poster_path: '/p.jpg' } });
      const req = mockReq({ params: { type: 'movie', tmdbId: '550' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await addWatch(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/movie/550');
      expect(prisma.watchlistItem.upsert).toHaveBeenCalledWith({
        where: { userId_mediaType_tmdbId: { userId: 'u1', mediaType: 'movie', tmdbId: 550 } },
        update: { title: 'Inception', posterPath: '/p.jpg' },
        create: { userId: 'u1', mediaType: 'movie', tmdbId: 550, title: 'Inception', posterPath: '/p.jpg' },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('201 adds tv with name/poster', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { name: 'Breaking Bad', poster_path: '/bb.jpg' } });
      const req = mockReq({ params: { type: 'tv', tmdbId: '1396' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await addWatch(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/tv/1396');
      expect(prisma.watchlistItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_mediaType_tmdbId: { userId: 'u1', mediaType: 'tv', tmdbId: 1396 } },
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('500 on error', async () => {
      (tmdbGet as jest.Mock).mockRejectedValue(new Error('tmdb'));
      const req = mockReq({ params: { type: 'movie', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await addWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removeWatch', () => {
    it('400 invalid type', async () => {
      const req = mockReq({ params: { type: 'x', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('400 invalid tmdbId', async () => {
      const req = mockReq({ params: { type: 'tv', tmdbId: 'bad' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('200 deletes by composite key', async () => {
      const req = mockReq({ params: { type: 'movie', tmdbId: '550' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await removeWatch(req, res);

      expect(prisma.watchlistItem.delete).toHaveBeenCalledWith({
        where: { userId_mediaType_tmdbId: { userId: 'u1', mediaType: 'movie', tmdbId: 550 } },
      });
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('500 on error', async () => {
      (prisma.watchlistItem.delete as jest.Mock).mockRejectedValue(new Error('db'));
      const req = mockReq({ params: { type: 'movie', tmdbId: '1' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await removeWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('listWatch', () => {
    it('400 invalid type', async () => {
      const req = mockReq({ params: { type: 'person' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await listWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns rows when full=false', async () => {
      const rows = [{ tmdbId: 1 }, { tmdbId: 2 }];
      (prisma.watchlistItem.findMany as jest.Mock).mockResolvedValue(rows);

      const req = mockReq({ params: { type: 'tv' }, query: { full: 'false' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await listWatch(req, res);

      expect(prisma.watchlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', mediaType: 'tv' },
        orderBy: { addedAt: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({ items: rows });
    });

    it('fetches details when full=true (movie)', async () => {
      const rows = [{ tmdbId: 550 }, { tmdbId: 603 }];
      (prisma.watchlistItem.findMany as jest.Mock).mockResolvedValue(rows);
      (tmdbGet as jest.Mock)
        .mockResolvedValueOnce({ data: { id: 550, title: 'Fight Club' } })
        .mockResolvedValueOnce({ data: { id: 603, title: 'The Matrix' } });

      const req = mockReq({ params: { type: 'movie' }, query: { full: 'true' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await listWatch(req, res);

      expect(tmdbGet).toHaveBeenNthCalledWith(1, '/movie/550');
      expect(tmdbGet).toHaveBeenNthCalledWith(2, '/movie/603');
      expect(res.json).toHaveBeenCalledWith({ items: [{ id: 550, title: 'Fight Club' }, { id: 603, title: 'The Matrix' }] });
    });

    it('fetches details when full=true (tv)', async () => {
      const rows = [{ tmdbId: 1396 }];
      (prisma.watchlistItem.findMany as jest.Mock).mockResolvedValue(rows);
      (tmdbGet as jest.Mock).mockResolvedValue({ data: { id: 1396, name: 'Breaking Bad' } });

      const req = mockReq({ params: { type: 'tv' }, query: { full: 'true' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();

      await listWatch(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/tv/1396');
      expect(res.json).toHaveBeenCalledWith({ items: [{ id: 1396, name: 'Breaking Bad' }] });
    });

    it('500 on error', async () => {
      (prisma.watchlistItem.findMany as jest.Mock).mockRejectedValue(new Error('db'));
      const req = mockReq({ params: { type: 'movie' } }); (req as any).user = { id: 'u1' };
      const res = mockRes();
      await listWatch(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
