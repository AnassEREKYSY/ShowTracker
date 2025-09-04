import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    actor: { upsert: jest.fn() },
  },
}));
jest.mock('../../src/tmdb', () => ({
  tmdbGet: jest.fn(),
}));

import { prisma } from '../../src/lib/prisma';
import { tmdbGet } from '../../src/tmdb';
import { searchPeople, getPerson } from '../../src/controllers/people.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return { params: {}, query: {}, ...opts } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('people.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('searchPeople', () => {
    it('400 if q missing', async () => {
      const req = mockReq({ query: { q: '   ' } });
      const res = mockRes();
      await searchPeople(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns items/page/totalPages', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({
        data: { results: [{ id: 1 }], page: 2, total_pages: 10 },
      });
      const req = mockReq({ query: { q: 'keanu', page: '2' } });
      const res = mockRes();

      await searchPeople(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/search/person', { query: 'keanu', include_adult: false, page: 2 });
      expect(res.json).toHaveBeenCalledWith({ items: [{ id: 1 }], page: 2, totalPages: 10 });
    });

    it('500 on error', async () => {
      (tmdbGet as jest.Mock).mockRejectedValue(new Error('down'));
      const req = mockReq({ query: { q: 'x' } });
      const res = mockRes();
      await searchPeople(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPerson', () => {
    it('400 invalid id', async () => {
      const req = mockReq({ params: { tmdbId: 'abc' } });
      const res = mockRes();
      await getPerson(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('fetches, upserts actor, returns data', async () => {
      (tmdbGet as jest.Mock).mockResolvedValue({
        data: { id: 6384, name: 'Keanu Reeves', profile_path: '/p.jpg' },
      });

      const req = mockReq({ params: { tmdbId: '6384' } });
      const res = mockRes();

      await getPerson(req, res);

      expect(tmdbGet).toHaveBeenCalledWith('/person/6384', { append_to_response: 'combined_credits' });
      expect(prisma.actor.upsert).toHaveBeenCalledWith({
        where: { tmdbId: 6384 },
        update: { name: 'Keanu Reeves', profilePath: '/p.jpg' },
        create: { tmdbId: 6384, name: 'Keanu Reeves', profilePath: '/p.jpg' },
      });
      expect(res.json).toHaveBeenCalledWith({ id: 6384, name: 'Keanu Reeves', profile_path: '/p.jpg' });
    });

    it('500 on error', async () => {
      (tmdbGet as jest.Mock).mockRejectedValue(new Error('down'));
      const req = mockReq({ params: { tmdbId: '1' } });
      const res = mockRes();
      await getPerson(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
