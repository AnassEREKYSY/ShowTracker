import { Router } from 'express';
import { addWatch, removeWatch, listWatch } from '../controllers/watchlist.controller';

const r = Router();
r.post('/watchlist/:type/:tmdbId', addWatch);
r.delete('/watchlist/:type/:tmdbId', removeWatch);
r.get('/watchlist/:type', listWatch);

export default r;
