import { airedEpisodes, pickProviders, pickTrailer, toCard, toPage } from '../../src/services/media';

describe('media helpers', () => {
  it('maps movies, shows and people to cards', () => {
    expect(toCard({ id: 1, media_type: 'movie', title: 'A', release_date: '2020-01-02', vote_average: 7.456 }))
      .toMatchObject({ id: 1, type: 'movie', title: 'A', year: 2020, rating: 7.5 });
    expect(toCard({ id: 2, name: 'B', first_air_date: '' }, 'tv')).toMatchObject({ type: 'tv', title: 'B', year: null });
    expect(toCard({ id: 3, media_type: 'person', name: 'C', profile_path: '/c.jpg' })).toMatchObject({ type: 'person', posterPath: '/c.jpg' });
    expect(toCard({ id: 4 })).toBeNull();
  });

  it('caps total pages at 500', () => {
    expect(toPage({ page: 1, total_pages: 9999, results: [] }).totalPages).toBe(500);
  });

  it('prefers an official YouTube trailer', () => {
    const t = pickTrailer({ results: [
      { site: 'YouTube', key: 'teaser', type: 'Teaser', official: true },
      { site: 'Vimeo', key: 'x', type: 'Trailer', official: true },
      { site: 'YouTube', key: 'fan', type: 'Trailer', official: false },
      { site: 'YouTube', key: 'main', type: 'Trailer', official: true, name: 'Official' },
    ] });
    expect(t).toEqual({ key: 'main', name: 'Official' });
    expect(pickTrailer({ results: [{ site: 'YouTube', key: 'bts', type: 'Featurette' }] })).toBeNull();
  });

  it('reads providers for the region, sorted by priority', () => {
    const p = pickProviders({ results: { FR: { link: 'l', flatrate: [
      { provider_id: 2, provider_name: 'B', display_priority: 5 },
      { provider_id: 1, provider_name: 'A', display_priority: 1 },
    ] } } }, 'FR');
    expect(p.stream.map(x => x.name)).toEqual(['A', 'B']);
    expect(p.rent).toEqual([]);
    expect(pickProviders({ results: {} }, 'FR').link).toBeNull();
  });

  it('counts aired episodes without specials', () => {
    expect(airedEpisodes({
      seasons: [{ season_number: 0, episode_count: 3 }, { season_number: 1, episode_count: 10 }, { season_number: 2, episode_count: 8 }],
      last_episode_to_air: { season_number: 2, episode_number: 5 },
    })).toBe(15);
  });
});
