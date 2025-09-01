import { TrendingItemDto, TrendingListResponseDto } from '../dtos/trending.dtos';
import { TrendingItem } from '../models/trending.models';

export function mapTrendingItem(d: TrendingItemDto): TrendingItem {
  return {
    id: d.id,
    mediaType: d.mediaType,
    tmdbId: d.tmdbId,
    rank: d.rank,
    timeWindow: d.timeWindow,
    fetchedAt: new Date(d.fetchedAt),
    title: d.title ?? null,
    posterPath: d.posterPath ?? null,
  };
}

export function mapTrendingList(resp: TrendingListResponseDto): TrendingItem[] {
  return (resp.items ?? []).map(mapTrendingItem);
}
