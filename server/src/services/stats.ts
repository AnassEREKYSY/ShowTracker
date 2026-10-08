export type StatsEntry = {
  mediaType: 'movie' | 'tv' | 'person';
  status: string | null;
  rating: number | null;
  runtime: number | null;
  watchedAt: Date | null;
  genres: string[];
  cast: string[];
};
export type StatsEpisode = { runtime: number | null; watchedAt: Date };

const DEFAULT_EPISODE_MIN = 40;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

function top(counts: Map<string, number>, n: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/** Pure computation so it can be unit tested without a database. */
export function computeStats(entries: StatsEntry[], episodes: StatsEpisode[], now = new Date()) {
  const status = (e: StatsEntry) => e.status ?? 'planned';
  const watchedMovies = entries.filter(e => e.mediaType === 'movie' && status(e) === 'watched');

  const movieMinutes = watchedMovies.reduce((n, e) => n + (e.runtime ?? 0), 0);
  const episodeMinutes = episodes.reduce((n, e) => n + (e.runtime ?? DEFAULT_EPISODE_MIN), 0);

  // Last 12 months, oldest first, including empty months.
  const months: { month: string; minutes: number; movies: number; episodes: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ month: monthKey(d), minutes: 0, movies: 0, episodes: 0 });
  }
  const byMonth = new Map(months.map(m => [m.month, m]));
  for (const m of watchedMovies) {
    const b = m.watchedAt && byMonth.get(monthKey(m.watchedAt));
    if (b) { b.minutes += m.runtime ?? 0; b.movies += 1; }
  }
  for (const e of episodes) {
    const b = byMonth.get(monthKey(e.watchedAt));
    if (b) { b.minutes += e.runtime ?? DEFAULT_EPISODE_MIN; b.episodes += 1; }
  }

  // Taste: what the user actually watches (watched or in progress).
  const engaged = entries.filter(e => e.mediaType !== 'person' && ['watched', 'watching'].includes(status(e)));
  const genreCounts = new Map<string, number>();
  const castCounts = new Map<string, number>();
  for (const e of engaged) {
    for (const g of e.genres ?? []) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    for (const c of (e.cast ?? []).slice(0, 5)) castCounts.set(c, (castCounts.get(c) ?? 0) + 1);
  }

  const rated = entries.filter(e => typeof e.rating === 'number' && e.rating! > 0);
  const ratingDistribution = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: rated.filter(e => e.rating === i + 1).length,
  }));

  const byStatus = (type: 'movie' | 'tv') => {
    const list = entries.filter(e => e.mediaType === type);
    return {
      planned: list.filter(e => status(e) === 'planned').length,
      watching: list.filter(e => status(e) === 'watching').length,
      watched: list.filter(e => status(e) === 'watched').length,
      dropped: list.filter(e => status(e) === 'dropped').length,
    };
  };

  return {
    totals: {
      minutes: movieMinutes + episodeMinutes,
      movieMinutes,
      episodeMinutes,
      moviesWatched: watchedMovies.length,
      showsCompleted: entries.filter(e => e.mediaType === 'tv' && status(e) === 'watched').length,
      episodesWatched: episodes.length,
      averageRating: rated.length ? Math.round((rated.reduce((n, e) => n + e.rating!, 0) / rated.length) * 10) / 10 : null,
      ratedCount: rated.length,
    },
    months,
    topGenres: top(genreCounts, 6),
    topCast: top(castCounts, 6),
    ratingDistribution,
    library: { movie: byStatus('movie'), tv: byStatus('tv') },
  };
}
