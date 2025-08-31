import { z } from 'zod';

export const GenreUpsertDto = z.object({
  tmdbId: z.coerce.number().int().positive(),
  name: z.string().min(1)
}).strict();
export type GenreUpsertDto = z.infer<typeof GenreUpsertDto>;
