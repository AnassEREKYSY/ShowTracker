import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

export const tmdb = axios.create({ baseURL: TMDB_BASE });
export type TmdbPaged<T> = {
  page: number;
  results: T[];
  total_pages?: number;
  total_results?: number;
};

export type TmdbTrendingItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
};

export async function tmdbGet<T = unknown>(path: string, params: Record<string, any> = {}) {
  return tmdb.get<T>(path, { params: { api_key: TMDB_KEY, language: "en-US", ...params } });
}
