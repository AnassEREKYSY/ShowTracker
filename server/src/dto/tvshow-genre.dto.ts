import { z } from 'zod';

export const TVShowGenreLinkDto = z.object({
  tvTmdbId: z.coerce.number().int().positive(),
  genreTmdbId: z.coerce.number().int().positive()
}).strict();
export type TVShowGenreLinkDto = z.infer<typeof TVShowGenreLinkDto>;
