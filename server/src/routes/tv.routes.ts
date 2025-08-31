import express from 'express';
import { getTvById, getPopularTv, discoverTv } from '../controllers/tv.controller';

const router = express.Router();

router.get('/tv/popular', getPopularTv);
router.get('/tv/discover', discoverTv);
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});
router.get('/tv/:id', getTvById);

export default router;
