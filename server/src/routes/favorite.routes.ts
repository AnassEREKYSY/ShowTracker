import { Router } from 'express';
import { addFavorite, listFavorites, removeFavorite } from '../controllers/favorites.controller';

const r = Router();

r.post('/favorites/:type/:tmdbId', addFavorite);
r.delete('/favorites/:type/:tmdbId', removeFavorite);
r.get('/favorites/:type', listFavorites);

export default r;
