import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import moviesRoutes from './routes/movies.routes';
import tvRoutes from './routes/tv.routes';
import genresRoutes from './routes/genres.routes';
import authRoutes from './routes/auth.routes';
import favoritesRoutes from './routes/favorite.routes';
import watchlistRoutes from './routes/watchlist.routes';
import trendingRoutes from './routes/trending.routes';
import peopleRoutes from './routes/people.routes';
import { requireAuth } from './middleware/requireAuth';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cookieParser());
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Public auth endpoints
app.use('/api/auth', authRoutes);

// Protected API
app.use('/api', requireAuth);
app.use('/api', moviesRoutes);
app.use('/api', tvRoutes);
app.use('/api', genresRoutes);
app.use('/api', favoritesRoutes);
app.use('/api', watchlistRoutes);
app.use('/api', trendingRoutes);
app.use('/api', peopleRoutes);

// Serve Angular app (built files copied to server/dist/public by Dockerfile)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));                // assets
app.get('*', (_req, res) => {                      // SPA fallback
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
