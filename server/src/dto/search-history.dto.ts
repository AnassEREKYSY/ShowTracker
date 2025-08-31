import { z } from 'zod';

export const SearchLogDto = z.object({
  query: z.string().min(1),
  totalResults: z.coerce.number().int().nonnegative().optional()
}).strict();
export type SearchLogDto = z.infer<typeof SearchLogDto>;