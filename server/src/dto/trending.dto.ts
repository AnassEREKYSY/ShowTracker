import { z } from 'zod';
import { MediaType, TimeWindow } from './common.js';

export const TrendingUpsertDto = z.object({
  mediaType: MediaType,
  tmdbId: z.coerce.number().int().positive(),
  rank: z.coerce.number().int().positive(),
  timeWindow: TimeWindow,
  title: z.string().optional(),
  posterPath: z.string().optional()
}).strict();
export type TrendingUpsertDto = z.infer<typeof TrendingUpsertDto>;
