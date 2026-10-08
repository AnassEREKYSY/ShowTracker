import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import libraryRoutes from './routes/library.routes';
import favoritesRoutes from './routes/favorite.routes';
import { requireAuth } from './middleware/requireAuth';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);

  // Everything below belongs to the signed-in user.
  const personal = express.Router();
  personal.use(requireAuth, libraryRoutes, favoritesRoutes);
  app.use('/api', personal);

  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api]', err?.message ?? err);
    res.status(500).json({ message: 'Server error' });
  });
  return app;
}
