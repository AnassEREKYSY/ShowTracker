import { computeStats, StatsEntry } from '../../src/services/stats';

const now = new Date('2026-10-08T12:00:00Z');
const entry = (e: Partial<StatsEntry>): StatsEntry => ({
  mediaType: 'movie', status: 'watched', rating: null, runtime: 100, watchedAt: now, genres: [], cast: [], ...e,
});

describe('computeStats', () => {
  it('adds movie and episode minutes', () => {
    const s = computeStats(
      [entry({ runtime: 120 }), entry({ runtime: 90, status: 'planned' })],
      [{ runtime: 45, watchedAt: now }, { runtime: null, watchedAt: now }],
      now,
    );
    expect(s.totals.movieMinutes).toBe(120);
    expect(s.totals.episodeMinutes).toBe(45 + 40); // unknown runtime counts as 40 min
    expect(s.totals.minutes).toBe(205);
    expect(s.totals.moviesWatched).toBe(1);
    expect(s.totals.episodesWatched).toBe(2);
  });

  it('returns the last 12 months with empty months included', () => {
    const s = computeStats([entry({ watchedAt: new Date('2026-03-15T00:00:00Z') })], [], now);
    expect(s.months).toHaveLength(12);
    expect(s.months[0].month).toBe('2025-11');
    expect(s.months[11].month).toBe('2026-10');
    expect(s.months.find(m => m.month === '2026-03')!.movies).toBe(1);
  });

  it('ranks genres and cast from watched and in-progress titles only', () => {
    const s = computeStats([
      entry({ genres: ['Drama', 'Crime'], cast: ['A', 'B'] }),
      entry({ mediaType: 'tv', status: 'watching', genres: ['Drama'], cast: ['A'] }),
      entry({ status: 'planned', genres: ['Horror'] }),
    ], [], now);
    expect(s.topGenres[0]).toEqual({ name: 'Drama', count: 2 });
    expect(s.topGenres.map(g => g.name)).not.toContain('Horror');
    expect(s.topCast[0]).toEqual({ name: 'A', count: 2 });
  });

  it('averages ratings and treats a null status as planned', () => {
    const s = computeStats([entry({ rating: 8 }), entry({ rating: 7, status: null })], [], now);
    expect(s.totals.averageRating).toBe(7.5);
    expect(s.library.movie.planned).toBe(1);
    expect(s.ratingDistribution.find(r => r.rating === 8)!.count).toBe(1);
  });
});
