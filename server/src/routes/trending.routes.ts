import express from 'express';
import { getTrending, syncTrending } from '../controllers/trending.controller';

const router = express.Router();

router.get('/trending', getTrending);
router.post('/admin/trending/sync', syncTrending);

export default router;
