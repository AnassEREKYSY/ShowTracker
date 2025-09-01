import { MediaType } from "../types/media.types";

export interface WatchlistItem {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string | null;
  posterPath?: string | null;
  addedAt: Date;
  position?: number | null;
  plannedAt?: Date | null;
  status?: string | null;
}
