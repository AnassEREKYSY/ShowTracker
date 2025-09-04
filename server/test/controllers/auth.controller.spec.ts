import type { Request, Response } from 'express';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('../../src/utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import { prisma } from '../../src/lib/prisma';
import { hash, compare } from 'bcryptjs';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt';
import { register, login, refresh, logout, me } from '../../src/controllers/auth.controller';

function mockReq(opts: Partial<Request> = {}): Request {
  return {
    body: {},
    headers: {},
    cookies: {},
    ...opts,
  } as any;
}
function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('register', () => {
    it('400 for invalid email', async () => {
      const req = mockReq({ body: { email: 'bad', password: 'secret12' } });
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('400 for short password', async () => {
      const req = mockReq({ body: { email: 'a@b.com', password: '123' } });
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('409 if email exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
      const req = mockReq({ body: { email: 'a@b.com', password: 'secret12' } });
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('201 on success, sets refresh cookie and returns access token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashed!');
      const created = { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() };
      (prisma.user.create as jest.Mock).mockResolvedValue(created);
      (signAccessToken as jest.Mock).mockReturnValue('acc');
      (signRefreshToken as jest.Mock).mockReturnValue('ref');

      const req = mockReq({ body: { email: 'a@b.com', password: 'secret12' } });
      const res = mockRes();

      await register(req, res);

      expect(hash).toHaveBeenCalledWith('secret12', 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', passwordHash: 'hashed!' },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });
      expect(signAccessToken).toHaveBeenCalledWith('u1');
      expect(signRefreshToken).toHaveBeenCalledWith('u1');
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'ref',
        expect.objectContaining({ httpOnly: true, path: '/api/auth/refresh' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user: created, accessToken: 'acc' });
    });

    it('500 on unexpected error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'));
      const req = mockReq({ body: { email: 'a@b.com', password: 'secret12' } });
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('400 when missing email/password', async () => {
      const req = mockReq({ body: { email: 'a@b.com' } });
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('401 when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const req = mockReq({ body: { email: 'a@b.com', password: 'x' } });
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 when password invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash: 'h', tokenVersion: 1 });
      (compare as jest.Mock).mockResolvedValue(false);
      const req = mockReq({ body: { email: 'a@b.com', password: 'x' } });
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 when valid; updates lastLogin, sets cookie, returns access token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1', email: 'a@b.com', passwordHash: 'h', tokenVersion: 3,
      });
      (compare as jest.Mock).mockResolvedValue(true);
      (signAccessToken as jest.Mock).mockReturnValue('acc');
      (signRefreshToken as jest.Mock).mockReturnValue('ref');

      const req = mockReq({ body: { email: 'a@b.com', password: 'okokok' } });
      const res = mockRes();

      await login(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' }, data: { lastLoginAt: expect.any(Date) },
      });
      expect(signAccessToken).toHaveBeenCalledWith('u1', 3);
      expect(signRefreshToken).toHaveBeenCalledWith('u1', 3);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ user: { id: 'u1', email: 'a@b.com' }, accessToken: 'acc' });
    });

    it('500 on unexpected error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('boom'));
      const req = mockReq({ body: { email: 'a@b.com', password: 'x' } });
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refresh', () => {
    it('401 when no cookie', async () => {
      const req = mockReq({ cookies: {} });
      const res = mockRes();
      await refresh(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 when invalid refresh token', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
      const req = mockReq({ cookies: { refresh_token: 'nope' } });
      const res = mockRes();
      await refresh(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('401 when tokenVersion mismatch (revoked)', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tv: 10 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', tokenVersion: 9 });
      const req = mockReq({ cookies: { refresh_token: 'x' } });
      const res = mockRes();
      await refresh(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 when ok; returns new access token + sets new refresh cookie', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tv: 2 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', tokenVersion: 2 });
      (signAccessToken as jest.Mock).mockReturnValue('new-acc');
      (signRefreshToken as jest.Mock).mockReturnValue('new-ref');

      const req = mockReq({ cookies: { refresh_token: 'x' } });
      const res = mockRes();

      await refresh(req, res);

      expect(signAccessToken).toHaveBeenCalledWith('u1', 2);
      expect(signRefreshToken).toHaveBeenCalledWith('u1', 2);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'new-acc' });
    });
  });

  describe('logout', () => {
    it('increments tokenVersion when bearer provided, clears cookie', async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue({ sub: 'u1' });

      const req = mockReq({ headers: { authorization: 'Bearer abc' } });
      const res = mockRes();

      await logout(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true, path: '/api/auth/refresh' })
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('still clears cookie when no bearer', async () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();
      await logout(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('500 when verifyAccessToken throws', async () => {
      (verifyAccessToken as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
      const req = mockReq({ headers: { authorization: 'Bearer x' } });
      const res = mockRes();
      await logout(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('me', () => {
    it('returns current user from req.user', async () => {
      const req = mockReq({} as any);
      (req as any).user = { id: 'u1', email: 'a@b.com' };
      const res = mockRes();
      await me(req, res);
      expect(res.json).toHaveBeenCalledWith({ user: { id: 'u1', email: 'a@b.com' } });
    });
  });
});
