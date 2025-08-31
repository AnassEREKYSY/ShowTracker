import { z } from 'zod';

export const MediaType = z.enum(['movie', 'tv']);
export type MediaType = z.infer<typeof MediaType>;

export const TimeWindow = z.enum(['day', 'week']);
export type TimeWindow = z.infer<typeof TimeWindow>;
