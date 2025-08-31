import { MediaType } from "../enums/media.enum";
import { TimeWindow } from "../enums/timeWindow.enum";

export interface Trending {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  rank: number;
  timeWindow: TimeWindow;
  fetchedAt: string;
  title?: string;
  posterPath?: string;
}