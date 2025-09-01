import { Router } from 'express';
import { searchPeople, getPerson } from '../controllers/people.controller';

const r = Router();
r.get('/people', searchPeople);
r.get('/people/:tmdbId', getPerson);
export default r;
