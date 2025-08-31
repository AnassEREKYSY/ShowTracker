import { z } from 'zod';

export const TVShowActorLinkDto = z.object({
  tvTmdbId: z.coerce.number().int().positive(),
  actorTmdbId: z.coerce.number().int().positive(),
  character: z.string().optional(),
  creditOrder: z.coerce.number().int().nonnegative().optional()
}).strict();
export type TVShowActorLinkDto = z.infer<typeof TVShowActorLinkDto>;
