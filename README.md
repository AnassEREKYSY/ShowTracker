# ShowTracker

Track the films and series you watch: a watchlist, episode-by-episode progress, a diary of everything you watched, and yearly stats. Film and series data come from [TMDB](https://www.themoviedb.org/).

Live: https://showtracker.anasserekysy.com

## Features

- **Browse without an account**: trending, popular films and series, Discover (genre, year, minimum rating, sort) and search across films, series and people.
- **Title pages**: trailer, where to watch in France (stream / rent / buy), cast, recommendations, key facts.
- **Library**: Watching, Watchlist, Watched, Dropped and Favourites, with your own rating (half stars) and a private note per title.
- **Series progress**: tick episodes or whole seasons; the series moves to Watching or Watched on its own. "Up next" on the home page shows the next episode of each series in progress.
- **Diary**: what you watched, by month, with ratings and notes.
- **Stats**: hours watched per month, films and episodes, average rating, top genres and actors.
- **Actor pages**: biography, known for, full filmography.

## Stack

| Part | Tech |
|---|---|
| Client | Angular 17 (standalone components, signals), Tailwind CSS, Playwright |
| API | Node.js 20, Express 5, Prisma 6, PostgreSQL 16, Redis (TMDB cache), JWT (access token + httpOnly refresh cookie), Jest |
| Delivery | Docker, GitHub Actions, GHCR, OVH VM behind an Nginx reverse proxy |

```
client/   Angular app, served by Nginx (proxies /api to the API container)
server/   Express API: catalog (TMDB, cached), auth, library, episodes, diary, stats
deploy/   docker-compose.prod.yml + deploy.sh used on the VM
```

## Run locally

Requirements: Node 20, PostgreSQL, Redis, a TMDB API key.

```bash
# API
cd server
cp .env.example .env        # fill DATABASE_URL, TMDB_API_KEY, JWT secrets
npm install
npx prisma db push          # creates or updates the schema
npm run dev                 # http://localhost:4000

# Client (another terminal)
cd client
npm install
npm start                   # http://localhost:4200
```

## Tests

```bash
cd server && npm test        # unit tests (controllers, stats, TMDB mapping)
cd client && npm run e2e     # Playwright, API mocked, starts the dev server itself
```

The pipeline also checks that the schema upgrade runs on a database created with the previous version without losing data.

## Deployment

Every push to `main` runs the tests, builds the two images, pushes them to GHCR and deploys them on the VM. See [DEPLOYMENT.md](DEPLOYMENT.md).

---

This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability by JustWatch.
