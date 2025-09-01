// src/routes/auth.routes.ts
import { Router } from 'express';
import { login, register, refresh, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   logout);        // { allDevices?: boolean }
router.post('/refresh',  refresh);       // uses httpOnly cookie
router.get('/me',        requireAuth, me);

export default router;
