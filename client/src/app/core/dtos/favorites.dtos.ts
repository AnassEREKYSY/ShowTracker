import { MediaType } from "../types/media.types";

export interface FavoriteRowDto {
  id: string;
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string | null;
  posterPath?: string | null;
  createdAt: string; 
}

export interface FavoritesListDto {
  items: FavoriteRowDto[];
}
