import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import moviesRoutes from './routes/movies.routes';
import tvRoutes from './routes/tv.routes';
import genresRoutes from './routes/genres.routes';


const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', moviesRoutes);
app.use('/api', tvRoutes);
app.use('/api', genresRoutes);

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
