import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || !isEmail(email)) return res.status(400).json({ message: 'Valid email required' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Password min length 6' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true, updatedAt: true }, 
    });

    const accessToken = signAccessToken(created.id);
    const refreshToken = signRefreshToken(created.id);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ user: created, accessToken });
  } catch {
    return res.status(500).json({ message: 'Register failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email & password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken = signAccessToken(user.id, user.tokenVersion);
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    setRefreshCookie(res, refreshToken);

    return res.json({ user: { id: user.id, email: user.email }, accessToken });
  } catch {
    return res.status(500).json({ message: 'Login failed' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.tv) return res.status(401).json({ message: 'Refresh token revoked' });

    const accessToken = signAccessToken(user.id, user.tokenVersion);
    const refreshToken = signRefreshToken(user.id, user.tokenVersion);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (token) {
      const { sub } = verifyAccessToken(token);
      await prisma.user.update({
        where: { id: sub },
        data: { tokenVersion: { increment: 1 } },
      });
    }
    res.clearCookie('refresh_token', {
      httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Logout failed' });
  }
};


export const me = async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; email: string };
  return res.json({ user });
};
