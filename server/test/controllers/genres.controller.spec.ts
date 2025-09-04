import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    genre: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  },
}));
jest.mock('../../src/tmdb', () => ({
  tmdbGet: jest.fn(),
}));

import { prisma } from '../../src/lib/prisma';
import { tmdbGet } from '../../src/tmdb';
import { getGenres, syncGenres } from '../../src/controllers/genres.controller';

function mockReq(): Request { return {} as any; }
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('genres.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getGenres returns rows ordered by name', async () => {
    (prisma.genre.findMany as jest.Mock).mockResolvedValue([{ tmdbId: 28, name: 'Action' }]);
    const res = mockRes();
    await getGenres(mockReq(), res);
    expect(prisma.genre.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    expect(res.json).toHaveBeenCalledWith([{ tmdbId: 28, name: 'Action' }]);
  });

  it('syncGenres fetches movie+tv, upserts uniques, then returns 201 with list', async () => {
    (tmdbGet as jest.Mock)
      .mockResolvedValueOnce({ data: { genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }] } }) // movie
      .mockResolvedValueOnce({ data: { genres: [{ id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }] } });    // tv

    const finalRows = [
      { tmdbId: 12, name: 'Adventure' },
      { tmdbId: 28, name: 'Action' },
      { tmdbId: 35, name: 'Comedy' },
    ];
    (prisma.genre.findMany as jest.Mock).mockResolvedValue(finalRows);

    const res = mockRes();
    await syncGenres({} as any, res);

    const txCalls = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    expect(txCalls).toHaveLength(3);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ count: 3, genres: finalRows });
  });
});
