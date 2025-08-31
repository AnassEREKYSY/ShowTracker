import express from 'express';
import { getPersonById } from '../controllers/person.controller';

const router = express.Router();

router.param('id', (req, res, next, id) => /^\d+$/.test(id) ? next() : res.status(400).json({ error: 'Invalid id' }));

router.get('/person/:id', getPersonById);

export default router;
