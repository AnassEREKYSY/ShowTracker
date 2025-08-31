import { z } from 'zod';

export const MovieActorLinkDto = z.object({
  movieTmdbId: z.coerce.number().int().positive(),
  actorTmdbId: z.coerce.number().int().positive(),
  character: z.string().optional(),
  creditOrder: z.coerce.number().int().nonnegative().optional()
}).strict();
export type MovieActorLinkDto = z.infer<typeof MovieActorLinkDto>;
