import { MediaType } from "../types/media.types";

export interface FavoriteItem {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string | null;
  posterPath?: string | null;
  createdAt: Date;
}
