import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import moviesRoutes from './routes/movies.routes';
import tvRoutes from './routes/tv.routes';
import genresRoutes from './routes/genres.routes';
import authRoutes from './routes/auth.routes';
import { requireAuth } from './middleware/requireAuth';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

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

app.use(express.json());
app.use(cookieParser());

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
