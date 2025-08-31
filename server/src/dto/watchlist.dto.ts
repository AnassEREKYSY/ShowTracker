import { z } from 'zod';
import { MediaType } from './common.js';

export const WatchlistAddDto = z.object({
  mediaType: MediaType,
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().optional(),
  posterPath: z.string().optional(),
  plannedAt: z.string().datetime().optional(),
  status: z.enum(['planned','watching','finished']).optional()
}).strict();
export type WatchlistAddDto = z.infer<typeof WatchlistAddDto>;

export const WatchlistPositionDto = z.object({
  position: z.coerce.number().int().nonnegative()
}).strict();
export type WatchlistPositionDto = z.infer<typeof WatchlistPositionDto>;
