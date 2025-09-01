import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../utils/jwt';

export type AuthUser = { id: string; email: string | null; tv: number };

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, tokenVersion: true },
    });

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.tokenVersion !== payload.tv) {
      return res.status(401).json({ message: 'Token revoked' });
    }

    req.user = { id: user.id, email: user.email, tv: user.tokenVersion };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
