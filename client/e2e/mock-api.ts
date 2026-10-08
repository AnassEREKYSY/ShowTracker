import { Page, Route } from '@playwright/test';

const API = 'http://localhost:4000/api';
const card = (id: number, type: 'movie' | 'tv', title: string) =>
  ({ id, type, title, year: 2020, posterPath: null, backdropPath: '/b.jpg', rating: 7.8, overview: 'An overview.' });
const page = <T>(results: T[]) => ({ page: 1, totalPages: 1, totalResults: results.length, results });

export const tv = {
  id: 20, type: 'tv', title: 'Harbor Lights', originalTitle: 'Harbor Lights', tagline: null, overview: 'A town by the sea.',
  posterPath: null, backdropPath: null, rating: 8.1, voteCount: 1200, genres: [{ id: 18, name: 'Drama' }], certification: '12',
  trailer: { key: 'abc123', name: 'Official Trailer' },
  providers: { region: 'FR', link: 'https://example.org', stream: [{ id: 8, name: 'Netflix', logoPath: null }], rent: [], buy: [] },
  cast: [{ id: 5, name: 'Ana Ruiz', character: 'Mara', profilePath: null }], directors: [{ id: 6, name: 'Leo Brandt' }],
  recommendations: [], date: '2020-01-01', year: 2020, runtime: 45, status: 'Ended', inProduction: false,
  networks: [{ id: 1, name: 'North', logoPath: null }], airedEpisodes: 3, nextEpisode: null,
  seasons: [{ number: 1, name: 'Season 1', episodeCount: 3, airDate: '2020-01-01', posterPath: null }],
};

export interface MockState { signedIn: boolean; episodes: { season: number; episode: number }[]; calls: { method: string; url: string; body?: any }[] }

export async function mockApi(p: Page, opts: { signedIn?: boolean } = {}): Promise<MockState> {
  const state: MockState = { signedIn: !!opts.signedIn, episodes: [], calls: [] };
  if (state.signedIn) await p.addInitScript(() => localStorage.setItem('st_access_token', 'token'));
  await p.route('https://image.tmdb.org/**', r => r.fulfill({ status: 204 }));
  await p.route(`${API}/**`, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api', '');
    const method = req.method();
    const body = req.postData() ? JSON.parse(req.postData()!) : undefined;
    state.calls.push({ method, url: req.url(), body });
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/auth/me') return state.signedIn ? json({ user: { id: 'u1', email: 'anna@example.org' } }) : json({}, 401);
    if (path === '/auth/login') {
      if (body?.password !== 'correct-horse') return json({ message: 'Invalid credentials' }, 401);
      state.signedIn = true;
      return json({ user: { id: 'u1', email: body.email }, accessToken: 'token' });
    }
    if (path === '/trending') return json(page([card(1, 'movie', 'Glass Summit'), card(2, 'tv', 'Harbor Lights')]));
    if (path === '/movie/popular') return json(page([card(3, 'movie', 'Quiet Orchard')]));
    if (path === '/tv/popular') return json(page([card(4, 'tv', 'Paper Signal')]));
    if (path.startsWith('/genres/')) return json([{ id: 18, name: 'Drama' }, { id: 35, name: 'Comedy' }]);
    if (path.startsWith('/discover/')) return json(page([card(url.searchParams.get('genre') === '35' ? 9 : 8, 'movie', url.searchParams.get('genre') === '35' ? 'Funny Thing' : 'Long Road')]));
    if (path === '/tv/20') return json(tv);
    if (path === '/tv/20/season/1') return json({
      number: 1, name: 'Season 1', overview: null, airDate: '2020-01-01',
      episodes: [1, 2, 3].map(n => ({ number: n, name: `Chapter ${n}`, overview: null, airDate: `2020-01-0${n}`, runtime: 45, stillPath: null, rating: 8 })),
    });
    if (path === '/library/tv/20' && method === 'GET') return json({ entry: null, favorite: false, episodes: state.episodes });
    if (path === '/library/tv/20/episodes' && method === 'PUT') {
      const keys = new Set(body.episodes.map((e: number) => `${body.season}:${e}`));
      state.episodes = body.watched
        ? [...state.episodes.filter(e => !keys.has(`${e.season}:${e.episode}`)), ...body.episodes.map((e: number) => ({ season: body.season, episode: e }))]
        : state.episodes.filter(e => !keys.has(`${e.season}:${e.episode}`));
      const status = state.episodes.length >= 3 ? 'watched' : 'watching';
      return json({ entry: { id: 'e', type: 'tv', tmdbId: 20, title: 'Harbor Lights', status, rating: null, notes: null, genres: [], watchedEpisodes: state.episodes.length, totalEpisodes: 3, addedAt: '', updatedAt: '', startedAt: null, watchedAt: null, posterPath: null, backdropPath: null, year: 2020, runtime: 45 }, episodes: state.episodes });
    }
    if (path === '/library/tv/20' && method === 'PUT') {
      return json({ entry: { id: 'e', type: 'tv', tmdbId: 20, title: 'Harbor Lights', status: body.status ?? 'planned', rating: body.rating ?? null, notes: null, genres: [], addedAt: '', updatedAt: '', startedAt: null, watchedAt: null, posterPath: null, backdropPath: null, year: 2020, runtime: 45, totalEpisodes: 3 } });
    }
    if (path === '/library/up-next') return json({ items: [] });
    if (path === '/library') return json({ items: [] });
    if (path.startsWith('/favorites/')) return json({ items: [] });
    if (path === '/stats') return json({
      totals: { minutes: 600, movieMinutes: 240, episodeMinutes: 360, moviesWatched: 2, showsCompleted: 1, episodesWatched: 8, averageRating: 8, ratedCount: 2 },
      months: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, minutes: i * 30, movies: i % 2, episodes: i })),
      topGenres: [{ name: 'Drama', count: 3 }], topCast: [{ name: 'Ana Ruiz', count: 2 }],
      ratingDistribution: Array.from({ length: 10 }, (_, i) => ({ rating: i + 1, count: i === 7 ? 2 : 0 })),
      library: { movie: { planned: 1, watching: 0, watched: 2, dropped: 0 }, tv: { planned: 0, watching: 1, watched: 1, dropped: 0 } },
    });
    return json({ message: `not mocked: ${method} ${path}` }, 404);
  });
  return state;
}
