import 'dotenv/config';
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

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

app.use('/api', requireAuth);

app.use('/api', moviesRoutes);
app.use('/api', tvRoutes);
app.use('/api', genresRoutes);
app.use('/api', favoritesRoutes);
app.use('/api', watchlistRoutes);
app.use('/api', trendingRoutes);
app.use('/api', peopleRoutes);

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
