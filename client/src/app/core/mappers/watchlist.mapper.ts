import { WatchlistRowDto } from '../dtos/watchlist.dtos';
import { WatchlistItem } from '../models/watchlist.model';

export function mapWatchlistRow(d: WatchlistRowDto): WatchlistItem {
  return {
    id: d.id,
    mediaType: d.mediaType,
    tmdbId: d.tmdbId,
    title: d.title ?? null,
    posterPath: d.posterPath ?? null,
    addedAt: new Date(d.addedAt),
    position: d.position ?? null,
    plannedAt: d.plannedAt ? new Date(d.plannedAt) : null,
    status: d.status ?? null,
  };
}
