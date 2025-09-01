import { MediaType } from "../types/media.types";


export interface WatchlistRowDto {
  id: string;
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string | null;
  posterPath?: string | null;
  addedAt: string;
  position?: number | null;
  plannedAt?: string | null;
  status?: string | null;
}

export interface WatchlistListDto {
  items: WatchlistRowDto[];
}
