export interface TVShow {
  id: string; tmdbId: number; name: string;
  firstAirDate?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  rating?: number | null;
  createdAt: string;
}