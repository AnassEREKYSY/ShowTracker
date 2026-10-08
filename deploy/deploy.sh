#!/usr/bin/env bash
# Deploys (or updates) ShowTracker on the VM. Called by GitHub Actions over SSH; can also be run by hand:
#   cd ~/showtracker && IMAGE_TAG=latest ./deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/showtracker}"
cd "$APP_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }
red() { printf '\033[0;31m%s\033[0m\n' "$*"; }

# 1. Secrets -> .env (owner only). A value that is not provided keeps its previous value.
touch .env && chmod 600 .env
set_env() {
  local key="$1" value="${2:-}"
  [ -z "$value" ] && return 0
  { grep -v "^${key}=" .env || true; printf '%s=%s\n' "$key" "$value"; } > .env.tmp
  mv .env.tmp .env && chmod 600 .env
}
env_get() { grep "^$1=" .env | tail -n1 | cut -d= -f2- || true; }

set_env IMAGE_TAG "${IMAGE_TAG:-latest}"
set_env POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
set_env TMDB_API_KEY "${TMDB_API_KEY:-}"
set_env TMDB_ACCESS_TOKEN "${TMDB_ACCESS_TOKEN:-}"
set_env JWT_ACCESS_SECRET "${JWT_ACCESS_SECRET:-}"
set_env JWT_REFRESH_SECRET "${JWT_REFRESH_SECRET:-}"
set_env CORS_ORIGIN "${CORS_ORIGIN:-https://showtracker.anasserekysy.com,https://api-showtracker.anasserekysy.com}"
set_env WATCH_REGION "${WATCH_REGION:-FR}"
set_env API_BIND "${API_BIND:-}"
set_env CLIENT_BIND "${CLIENT_BIND:-}"
for k in POSTGRES_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  [ -n "$(env_get $k)" ] || { red "$k is missing (GitHub secrets)"; exit 1; }
done
[ -n "$(env_get TMDB_API_KEY)$(env_get TMDB_ACCESS_TOKEN)" ] || { red "TMDB_API_KEY or TMDB_ACCESS_TOKEN is required"; exit 1; }

# 2. Registry login (GHCR)
if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-anasserekysy}" --password-stdin >/dev/null
fi
docker network inspect web >/dev/null 2>&1 || { yellow "Creating Docker network web"; docker network create web >/dev/null; }

# 3. The old pipeline wrote docker-compose.yml here; the stack is now described by docker-compose.prod.yml.
[ -f docker-compose.yml ] && mv -f docker-compose.yml docker-compose.yml.old

# 4. Pull and (re)start. The API syncs the database schema on start (additive changes only).
green "Pulling images (tag: $(env_get IMAGE_TAG))"
$COMPOSE pull
green "Starting the stack"
$COMPOSE up -d --remove-orphans

# 5. Wait until the site answers through the client's Nginx (checks client + API + database).
yellow "Waiting for http://127.0.0.1:8080/api/health ..."
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    green "ShowTracker is up (healthy after ~$((i * 5))s)"
    $COMPOSE ps
    docker image prune -f >/dev/null || true
    exit 0
  fi
  sleep 5
done

red "The API did not become healthy in time. Last API logs:"
$COMPOSE logs --tail 80 api || true
$COMPOSE ps
exit 1
