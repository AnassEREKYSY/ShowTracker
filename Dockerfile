# Allow flexible repo layouts (defaults match your repo)
ARG CLIENT_DIR=client
ARG SERVER_DIR=server

# ===== build client (Angular) =====
FROM node:20-alpine AS client-build
ARG CLIENT_DIR
WORKDIR /app/client
COPY ${CLIENT_DIR}/package*.json ./
RUN npm ci
COPY ${CLIENT_DIR}/ ./
# (Optional) If prerender causes API fetch errors at build time, try:
# RUN npx ng build --configuration=production --prerender=false
RUN npm run build -- --configuration=production

# ===== build server (Node + Prisma) =====
FROM node:20-alpine AS server-build
ARG SERVER_DIR
WORKDIR /app/server
COPY ${SERVER_DIR}/package*.json ./
RUN npm ci
COPY ${SERVER_DIR}/ ./
# generate prisma client and compile TypeScript
RUN npm run prisma:generate
RUN npm run build
# keep dev deps so prisma CLI is available at runtime for migrate/db push

# ===== runtime =====
FROM node:20-alpine AS runtime
# IMPORTANT: set workdir to /app/server so Prisma sees ./prisma/schema.prisma
WORKDIR /app/server
ENV NODE_ENV=production

# server runtime: dist, prisma schema, node_modules (includes prisma CLI)
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/node_modules ./node_modules

# client build → served as static by the API
# (Angular outputs to dist/<projectName>/browser)
COPY --from=client-build /app/client/dist/*/browser ./dist/public

EXPOSE 4000

# Run migrations (prefer migrate deploy, fallback to db push), then start API
# dotenv/config is used in your code, but we also try to load it here for the migration step.
CMD sh -c "node -e 'try{require(\"dotenv\").config()}catch(e){}' \
  && npx prisma migrate deploy || npx prisma db push \
  && node dist/index.js"
