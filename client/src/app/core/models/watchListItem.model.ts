import { MediaType } from "../enums/media.enum";

export interface WatchlistItem {
  id: string;
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string;
  posterPath?: string;
  addedAt: string;
  position?: number | null;
  plannedAt?: string | null;
  status?: 'planned' | 'watching' | 'finished' | null;
}