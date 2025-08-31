import express from 'express';
import { getTrending, syncTrending } from '../controllers/trending.controller';

const router = express.Router();

router.get('/trending', getTrending);
router.post('/admin/sync/trending', syncTrending);

export default router;
