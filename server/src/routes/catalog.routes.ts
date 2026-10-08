import express, { Request, Response } from 'express';
import { details, discover, genres, person, popular, search, season, trending } from '../controllers/catalog.controller';

type Handler = (req: Request, res: Response) => unknown;
// Express 5 has no regex params, so movie and tv routes are declared explicitly.
const as = (type: 'movie' | 'tv', h: Handler): Handler => (req, res) => {
  req.params = { ...req.params, type };
  return h(req, res);
};

// Public: browsing works without an account.
const r = express.Router();
r.get('/trending', trending);
r.get('/search', search);
r.get('/genres/:type', genres);
r.get('/discover/:type', discover);
r.get('/movie/popular', as('movie', popular));
r.get('/tv/popular', as('tv', popular));
r.get('/tv/:id/season/:n', season);
r.get('/movie/:id', as('movie', details));
r.get('/tv/:id', as('tv', details));
r.get('/person/:id', person);
export default r;
