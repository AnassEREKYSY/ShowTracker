import { z } from 'zod';

export const ActorUpsertDto = z.object({
  tmdbId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  profilePath: z.string().optional()
}).strict();
export type ActorUpsertDto = z.infer<typeof ActorUpsertDto>;
