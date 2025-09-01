import { MediaType } from "../types/media.types";

export type TimeWindowDto = 'day' | 'week';

export interface TrendingItemDto {
  id: string;
  mediaType: MediaType; 
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
