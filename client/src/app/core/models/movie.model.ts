export interface Movie {
  id: string; tmdbId: number; title: string;
  releaseDate?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  rating?: number | null;
  createdAt: string;
}

