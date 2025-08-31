# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build


# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Entrypoint runs schema sync (db push) then starts API. For real prod, switch to migrate deploy.
CMD sh -c "node -e 'try{require(\"dotenv\").config()}catch(e){}' && npx prisma db push && node dist/index.js"
EXPOSE 4000