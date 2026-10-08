export type MediaKind = 'movie' | 'tv';
export type Status = 'planned' | 'watching' | 'watched' | 'dropped';

export interface MediaCard {
  id: number;
  type: MediaKind | 'person';
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  overview?: string;
  genreIds?: number[];
  knownFor?: string;
  character?: string | null;
}

export interface Paged<T> { page: number; totalPages: number; totalResults: number; results: T[]; }
export interface Genre { id: number; name: string; }
export interface Provider { id: number; name: string; logoPath: string | null; }
export interface CastMember { id: number; name: string; character: string | null; profilePath: string | null; episodes?: number; }

export interface Details {
  id: number;
  type: MediaKind;
  title: string;
  originalTitle: string;
  tagline: string | null;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  voteCount: number;
  genres: Genre[];
  certification: string | null;
  trailer: { key: string; name: string } | null;
  providers: { region: string; link: string | null; stream: Provider[]; rent: Provider[]; buy: Provider[] };
  cast: CastMember[];
  directors: { id: number; name: string }[];
  recommendations: MediaCard[];
  date: string | null;
  year: number | null;
  runtime: number | null;
  status: string | null;
  // tv only
  inProduction?: boolean;
  networks?: { id: number; name: string; logoPath: string | null }[];
  airedEpisodes?: number;
  nextEpisode?: { season: number; episode: number; airDate: string; name: string } | null;
  seasons?: { number: number; name: string; episodeCount: number; airDate: string | null; posterPath: string | null }[];
}

export interface Episode {
  number: number; name: string; overview: string | null; airDate: string | null;
  runtime: number | null; stillPath: string | null; rating: number | null;
}
export interface Season { number: number; name: string; overview: string | null; airDate: string | null; episodes: Episode[]; }

export interface Person {
  id: number; name: string; biography: string | null; birthday: string | null; deathday: string | null;
  placeOfBirth: string | null; profilePath: string | null; department: string | null;
  knownFor: MediaCard[]; filmography: MediaCard[];
}

export interface LibraryEntry {
  id: string;
  type: MediaKind;
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  year: number | null;
  status: Status;
  rating: number | null;
  notes: string | null;
  runtime: number | null;
  totalEpisodes: number | null;
  watchedEpisodes?: number;
  genres: string[];
  addedAt: string;
  updatedAt: string;
  startedAt: string | null;
  watchedAt: string | null;
}

export interface EpisodeRef { season: number; episode: number; }
export interface TitleState { entry: LibraryEntry | null; favorite: boolean; episodes?: EpisodeRef[]; }

export interface UpNext {
  show: { tmdbId: number; title: string | null; posterPath: string | null; backdropPath: string | null };
  season: number; episode: number; name: string; stillPath: string | null; airDate: string | null;
  runtime: number | null; watchedEpisodes: number; totalEpisodes: number | null;
}

export interface DiaryItem {
  kind: 'movie' | 'episodes';
  at: string;
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  year: number | null;
  rating: number | null;
  notes: string | null;
  minutes: number;
  episodes?: EpisodeRef[];
}

export interface Stats {
  totals: {
    minutes: number; movieMinutes: number; episodeMinutes: number; moviesWatched: number;
    showsCompleted: number; episodesWatched: number; averageRating: number | null; ratedCount: number;
  };
  months: { month: string; minutes: number; movies: number; episodes: number }[];
  topGenres: { name: string; count: number }[];
  topCast: { name: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  library: Record<MediaKind, Record<Status, number>>;
}

export interface Favorite { id: string; mediaType: MediaKind | 'person'; tmdbId: number; title: string | null; posterPath: string | null; createdAt: string; }

export const STATUS_LABEL: Record<Status, string> = {
  planned: 'Watchlist',
  watching: 'Watching',
  watched: 'Watched',
  dropped: 'Dropped',
};
