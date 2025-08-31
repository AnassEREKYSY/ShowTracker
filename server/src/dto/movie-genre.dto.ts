import { z } from 'zod';

export const MovieGenreLinkDto = z.object({
  movieTmdbId: z.coerce.number().int().positive(),
  genreTmdbId: z.coerce.number().int().positive()
}).strict();
export type MovieGenreLinkDto = z.infer<typeof MovieGenreLinkDto>;
