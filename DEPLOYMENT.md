# Deploying ShowTracker to the OVH VM

On each push to `main`, `.github/workflows/ci-cd.yml`:

1. runs the API unit tests, the database upgrade check and the client end-to-end tests;
2. builds `ghcr.io/anasserekysy/showtracker-api` and `showtracker-client`, tagged `latest` and with the commit SHA;
3. copies `deploy/docker-compose.prod.yml` and `deploy/deploy.sh` to `~/showtracker` on the VM and runs `deploy.sh`.

`deploy.sh` writes `~/showtracker/.env` from the secrets, pulls the images of this commit, restarts the stack
and waits for `http://127.0.0.1:8080/api/health` (client Nginx -> API -> database).

## Containers

| Container | Role | Port on the VM |
|---|---|---|
| `showtracker-client-1` | Angular app + `/api` proxy | 8080 |
| `showtracker-api-1` | Express API | 4000 |
| `showtracker-db-1` | PostgreSQL 16 (volume `showtracker_db-data`, kept across deploys) | none |
| `showtracker-redis-1` | TMDB cache | none |

The client and API are on the `web` Docker network of the `reverse-proxy` container, which serves
`showtracker.anasserekysy.com` (and `api-showtracker.anasserekysy.com`) with HTTPS.
The site calls the API on its own domain (`/api`), so the API subdomain is optional.

On start, the API runs `prisma db push` (additive changes only; it stops instead of dropping data).

## GitHub secrets (Settings > Secrets and variables > Actions)

| Secret | Use |
|---|---|
| `OVH_HOST`, `OVH_USER`, `SSH_PRIVATE_KEY` | SSH to the VM |
| `GHCR_TOKEN` | Pull the images on the VM (PAT with `read:packages`) |
| `POSTGRES_PASSWORD` | Database password (must stay the same: it is stored in the existing volume) |
| `TMDB_API_KEY` or `TMDB_ACCESS_TOKEN` | TMDB |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing |

Optional variables: `SHOWTRACKER_API_BIND` / `SHOWTRACKER_CLIENT_BIND` (default `0.0.0.0`). Set them to `127.0.0.1`
once the reverse proxy reaches the containers by name, so ports 4000 and 8080 are no longer public.

## Useful commands on the VM

```bash
cd ~/showtracker
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
IMAGE_TAG=latest ./deploy.sh        # redeploy by hand
```
