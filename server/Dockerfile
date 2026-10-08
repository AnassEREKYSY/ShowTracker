# Build: install, generate the Prisma client, compile TypeScript, then drop dev dependencies.
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Runtime: compiled code + production node_modules (includes the Prisma CLI and generated client).
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production PRISMA_HIDE_UPDATE_MESSAGE=1
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
# Sync the schema (additive changes only; refuses anything that would lose data), then start.
CMD ["sh", "-c", "npx prisma db push --skip-generate && exec node dist/index.js"]
