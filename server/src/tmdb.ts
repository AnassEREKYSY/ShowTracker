import axios from "axios";
import { redis } from "./lib/redis";

// TMDB_BASE_URL can point to a local mock in development.
const TMDB_BASE = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;

export const tmdb = axios.create({
  baseURL: TMDB_BASE,
  timeout: 10000,
  headers: !TMDB_KEY && TMDB_TOKEN ? { Authorization: `Bearer ${TMDB_TOKEN}` } : undefined,
});

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
  return tmdb.get<T>(path, {
    params: { ...(TMDB_KEY ? { api_key: TMDB_KEY } : {}), language: "en-US", ...params },
  });
}

/** TMDB GET with a Redis cache. A Redis outage never breaks the request. */
export async function tmdbCached<T = any>(key: string, ttlSec: number, path: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch { /* cache miss */ }
  const { data } = await tmdbGet<T>(path, params);
  try { await redis.set(key, JSON.stringify(data), "EX", ttlSec); } catch { /* ignore */ }
  return data;
}

export const TTL = { short: 60 * 10, medium: 60 * 60, long: 60 * 60 * 12 } as const;

export { WATCH_REGION } from "./config";
