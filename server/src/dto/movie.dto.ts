import { z } from 'zod';

export const MovieUpsertDto = z.object({
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().min(1),
  releaseDate: z.string().datetime().optional(),
  overview: z.string().optional(),
  posterPath: z.string().optional(),
  backdropPath: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional()
}).strict();
export type MovieUpsertDto = z.infer<typeof MovieUpsertDto>;
