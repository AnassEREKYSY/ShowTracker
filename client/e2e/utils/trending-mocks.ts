import { Page } from '@playwright/test';

export type TimeWindow = 'day' | 'week';
export type MediaType = 'movie';

type TrendingItemDto = {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  rank: number;
  timeWindow: TimeWindow;
  fetchedAt: string;
  title?: string | null;
  posterPath?: string | null;
};

type TrendingListResponseDto = {
  items: TrendingItemDto[];
};

function jsonHeaders() {
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
  };
}

function makeItems(tw: TimeWindow, count: number, offset = 0): TrendingItemDto[] {
  const base = tw === 'day' ? 1000 : 2000;
  return Array.from({ length: count }, (_, i) => {
    const idNum = base + offset + i + 1;
    return {
      id: `${tw}-${idNum}`,
      mediaType: 'movie',
      tmdbId: idNum,
      rank: i + 1,
      timeWindow: tw,
      fetchedAt: new Date(2023, 6, 1).toISOString(),
      title: `${tw.toUpperCase()} Movie ${idNum}`,
      posterPath: `/p/${idNum}.jpg`,
    };
  });
}

export type TrendingMockOptions = {
  emptyWeekInitially?: boolean;
  slowDayFirstLoadMs?: number;
};

export function setupTrendingApiMocks(page: Page, opts: TrendingMockOptions = {}) {
  const calls = {
    get: new Map<string, number>(),
    sync: 0,
  };
  page.route('**/api/me', async route => {
    const body = {
      id: 'e2e-user',
      email: 'e2e@example.com',
      user: { id: 'e2e-user', email: 'e2e@example.com' },
    };
    await route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(body) });
  });
  page.route('**/api/favorites/**', async route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ items: [] }) });
    }
    return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ ok: true }) });
  });
  page.route('**/api/watchlist/**', async route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ items: [] }) });
    }
    return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ ok: true }) });
  });
  let weekWasEmptyAndFetched = false;
  let dayFirstLoadPending = opts.slowDayFirstLoadMs && opts.slowDayFirstLoadMs > 0;
  page.route('**/api/trending**', async route => {
    const url = new URL(route.request().url());
    const mediaType = (url.searchParams.get('mediaType') || 'movie') as MediaType;
    const tw = (url.searchParams.get('timeWindow') || 'day') as TimeWindow;
    const limit = Number(url.searchParams.get('limit') || '20');

    const key = `${mediaType}::${tw}::${limit}`;
    calls.get.set(key, (calls.get.get(key) ?? 0) + 1);
    if (dayFirstLoadPending && tw === 'day' && limit === 20) {
      dayFirstLoadPending = false;
      await new Promise(r => setTimeout(r, opts.slowDayFirstLoadMs));
    }
    if (opts.emptyWeekInitially && tw === 'week' && limit === 20 && !weekWasEmptyAndFetched) {
      const body: TrendingListResponseDto = { items: [] };
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(body) });
    }
    const body: TrendingListResponseDto = { items: makeItems(tw, limit) };
    await route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(body) });
  });

  page.route('**/api/admin/trending/sync**', async route => {
    calls.sync++;
    const url = new URL(route.request().url());
    const tw = (url.searchParams.get('timeWindow') || 'day') as TimeWindow;
    if (opts.emptyWeekInitially && tw === 'week' && !weekWasEmptyAndFetched) {
      weekWasEmptyAndFetched = true;
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({ ok: true, synced: 20 }),
    });
  });

  return { calls };
}
