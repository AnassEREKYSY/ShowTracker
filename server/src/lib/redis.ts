// server/src/lib/redis.ts
import Redis from "ioredis";

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

// Keep the client small & resilient
export const redis = new Redis(url, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log(`[Redis] connected: ${url}`);
});

redis.on("ready", () => {
  console.log("[Redis] ready");
});

redis.on("error", (err) => {
  console.error("[Redis] error:", err?.message || err);
});

// Optional tiny helpers (JSON cache)
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSec);
}

export async function cacheDel(key: string) {
  await redis.del(key);
}
