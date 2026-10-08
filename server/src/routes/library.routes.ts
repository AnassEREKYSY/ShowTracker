import express from 'express';
import { diary, list, remove, setEpisodes, state, stats, upNext, upsert } from '../controllers/library.controller';

const r = express.Router();
r.get('/library', list);
r.get('/library/up-next', upNext);
r.put('/library/tv/:id/episodes', setEpisodes);
r.get('/library/:type/:id', state);
r.put('/library/:type/:id', upsert);
r.delete('/library/:type/:id', remove);
r.get('/diary', diary);
r.get('/stats', stats);
export default r;
