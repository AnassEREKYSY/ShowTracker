import express from 'express';
import {
  getMovieById,
  getPopularMovies,
  discoverMovies
} from '../controllers/movies.controller';

const router = express.Router();

router.get('/movies/popular', getPopularMovies);
router.get('/movies/discover', discoverMovies);

router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});

router.get('/movies/:id', getMovieById);

export default router;
