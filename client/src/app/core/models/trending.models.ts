export type MediaType = 'movie' | 'tv';
export type TimeWindow = 'day' | 'week';

export interface TrendingItem {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  rank: number;
  timeWindow: TimeWindow;
  fetchedAt: Date;
  title?: string | null;
  posterPath?: string | null;
}
