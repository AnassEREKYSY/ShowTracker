import { FavoriteRowDto } from '../dtos/favorites.dtos';
import { FavoriteItem } from '../models/favorites.model';

export function mapFavoriteRow(d: FavoriteRowDto): FavoriteItem {
  return {
    id: d.id,
    mediaType: d.mediaType,
    tmdbId: d.tmdbId,
    title: d.title ?? null,
    posterPath: d.posterPath ?? null,
    createdAt: new Date(d.createdAt),
  };
}
