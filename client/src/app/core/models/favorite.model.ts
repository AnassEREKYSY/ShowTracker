import { MediaType } from "../enums/media.enum";

export interface Favorite {
  id: string;
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  title?: string;
  posterPath?: string;
  createdAt: string;
}