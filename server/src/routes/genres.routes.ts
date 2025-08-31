import express from 'express';
import { getGenres, syncGenres } from '../controllers/genres.controller';

const router = express.Router();

router.get('/genres', getGenres);
router.post('/admin/sync/genres', syncGenres);

export default router;
