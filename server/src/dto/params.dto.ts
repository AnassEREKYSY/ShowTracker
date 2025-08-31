import { z } from 'zod';
import { MediaType, TimeWindow } from './common.js';

export const TmdbIdParam = z.object({ tmdbId: z.coerce.number().int().nonnegative() });
export type TmdbIdParam = z.infer<typeof TmdbIdParam>;

export const UuidParam = z.object({ id: z.string().uuid() });
export type UuidParam = z.infer<typeof UuidParam>;

export const MediaTypeQuery = z.object({ mediaType: MediaType.default('movie') });
export type MediaTypeQuery = z.infer<typeof MediaTypeQuery>;

export const TrendingQuery = z.object({
  mediaType: MediaType.default('movie'),
  timeWindow: TimeWindow.default('day')
});
export type TrendingQuery = z.infer<typeof TrendingQuery>;
