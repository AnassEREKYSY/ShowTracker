import { z } from 'zod';

export const TVShowUpsertDto = z.object({
  tmdbId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  firstAirDate: z.string().datetime().optional(),
  overview: z.string().optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional()
}).strict();
export type TVShowUpsertDto = z.infer<typeof TVShowUpsertDto>;
