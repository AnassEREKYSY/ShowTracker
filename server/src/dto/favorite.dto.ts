import { z } from 'zod';
import { MediaType } from './common.js';

export const FavoriteAddDto = z.object({
  mediaType: MediaType,
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().optional(),
  posterPath: z.string().optional()
}).strict();
export type FavoriteAddDto = z.infer<typeof FavoriteAddDto>;
