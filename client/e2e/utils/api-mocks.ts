import { Page } from '@playwright/test';

export type PagedDto<T> = { page: number; results: T[]; total_pages?: number; total_results?: number };
export type MovieSummaryDto = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
};
export type MovieDto = MovieSummaryDto & {
  runtime?: number;
  genres?: { id: number; name: string }[];
};

function paged<T>(page: number, results: T[], total_pages?: number, total_results?: number): PagedDto<T> {
  return { page, results, total_pages, total_results };
}
function movieSummary(id: number, p: Partial<MovieSummaryDto> = {}): MovieSummaryDto {
  return {
    id,
    title: `Movie ${id}`,
    overview: `Overview ${id}`,
    release_date: '2023-05-12',
    poster_path: `/p/${id}.jpg`,
    backdrop_path: `/b/${id}.jpg`,
    vote_average: 7.6,
    ...p,
  };
}
function movieDetails(id: number, p: Partial<MovieDto> = {}): MovieDto {
  const base = movieSummary(id, p);
  return { ...base, runtime: 120, genres: [{ id: 1, name: 'Action' }], ...p };
}

/** Call in beforeEach: ensures guard lets you in for E2E */
export async function primeAuth(page: Page) {
  await page.addInitScript(() => {
    try {
      // ✅ Tell the guard to bypass auth in E2E
      window.localStorage.setItem('E2E_DISABLE_AUTH', '1');

      // Optional extras if your app reads tokens elsewhere
      const keys = ['accessToken', 'auth.accessToken', 'access-token', 'token', 'jwt'];
      keys.forEach(k => {
        try {
          localStorage.setItem(k, 'e2e-token');
          sessionStorage.setItem(k, 'e2e-token');
        } catch {}
      });
      document.cookie = 'access_token=e2e-token; Path=/;';
    } catch {}
  });
}

function jsonHeaders() {
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
  };
}

/**
 * Mocks everything the Home page needs:
 * - Auth/user bootstrap:   GET /api/me
 * - Favorites & Watchlist: /api/favorites/**, /api/watchlist/**
 * - Movies data:           /api/movies/discover, /api/movies/popular, /api/movies/:id
 */
export function setupHomeApiMocks(page: Page) {
  const calls = {
    discover: 0,
    popular: new Map<number, number>(),
    details: 0,
  };

  // ---------- Common bootstrap endpoints (fix your errors) ----------
  // /api/me (return a minimal "logged-in" user)
  page.route('**/api/me', async route => {
    const body = {
      id: 'e2e-user',
      email: 'e2e@example.com',
      createdAt: new Date().toISOString(),
      // also include nested "user" for apps that expect { user: {...} }
      user: { id: 'e2e-user', email: 'e2e@example.com', createdAt: new Date().toISOString() },
    };
    await route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(body) });
  });

  // /api/favorites/**
  page.route('**/api/favorites/**', async route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ items: [] }) });
    }
    // POST/DELETE add/remove
    return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ ok: true }) });
  });

  // /api/watchlist/**
  page.route('**/api/watchlist/**', async route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ items: [] }) });
    }
    return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify({ ok: true }) });
  });

  // ---------- Movies data used by Home ----------
  const DISCOVER_1 = paged(1, [movieSummary(1, { title: 'Hero Movie', release_date: '2021-10-01', vote_average: 8.4 })], 1, 1);
  const POP1_RESULTS = Array.from({ length: 8 }, (_, i) => movieSummary(100 + i));
  const POP2_RESULTS = Array.from({ length: 8 }, (_, i) => movieSummary(200 + i));
  const POP3_RESULTS = Array.from({ length: 8 }, (_, i) => movieSummary(300 + i));
  const TOTAL_PAGES = 3;

  // /api/movies/discover
  page.route('**/movies/discover**', async route => {
    calls.discover++;
    const url = new URL(route.request().url());
    const pageParam = Number(url.searchParams.get('page') ?? '1');
    const sortBy = url.searchParams.get('sort_by') ?? '';
    if (pageParam === 1 && sortBy === 'popularity.desc') {
      await route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(DISCOVER_1) });
    } else {
      await route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(paged(pageParam, [])) });
    }
  });

  // /api/movies/popular?page=N
  page.route('**/movies/popular**', async route => {
    const url = new URL(route.request().url());
    const p = Number(url.searchParams.get('page') ?? '1');
    calls.popular.set(p, (calls.popular.get(p) ?? 0) + 1);

    if (p === 1)
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(paged(1, POP1_RESULTS, TOTAL_PAGES, TOTAL_PAGES * 8)) });
    if (p === 2)
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(paged(2, POP2_RESULTS, TOTAL_PAGES, TOTAL_PAGES * 8)) });
    if (p === 3)
      return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(paged(3, POP3_RESULTS, TOTAL_PAGES, TOTAL_PAGES * 8)) });

    return route.fulfill({ status: 200, headers: jsonHeaders(), body: JSON.stringify(paged(p, [], TOTAL_PAGES, TOTAL_PAGES * 8)) });
  });

  page.route('**/movies/*', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith('/popular') || path.endsWith('/discover') || path.endsWith('/search')) {
      return route.fallback();
    }
    const match = path.match(/\/movies\/(\d+)$/);
    if (match) {
      calls.details++;
      const id = Number(match[1]);
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(movieDetails(id, { title: `Movie ${id}` })),
      });
    }
    return route.fallback();
  });

  return { calls };
}
