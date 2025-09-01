export type MediaTypeDto = 'movie' | 'tv';
export type TimeWindowDto = 'day' | 'week';

export interface TrendingItemDto {
  id: string;
  mediaType: MediaTypeDto; 
  tmdbId: number;
  rank: number;
  timeWindow: TimeWindowDto;
  fetchedAt: string;
  title?: string | null;
  posterPath?: string | null;
}

export interface TrendingListResponseDto {
  items: TrendingItemDto[];
}

export interface TrendingSyncResponseDto {
  count: number;
  fetchedAt: string;
}
