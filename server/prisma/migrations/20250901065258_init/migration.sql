-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('movie', 'tv');

-- CreateEnum
CREATE TYPE "public"."TimeWindow" AS ENUM ('day', 'week');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Actor" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "profilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Genre" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Movie" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TVShow" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "firstAirDate" TIMESTAMP(3),
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TVShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovieActor" (
    "movieId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "character" TEXT,
    "creditOrder" INTEGER,

    CONSTRAINT "MovieActor_pkey" PRIMARY KEY ("movieId","actorId")
);

-- CreateTable
CREATE TABLE "public"."TVShowActor" (
    "tvShowId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "character" TEXT,
    "creditOrder" INTEGER,

    CONSTRAINT "TVShowActor_pkey" PRIMARY KEY ("tvShowId","actorId")
);

-- CreateTable
CREATE TABLE "public"."MovieGenre" (
    "movieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("movieId","genreId")
);

-- CreateTable
CREATE TABLE "public"."TVShowGenre" (
    "tvShowId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "TVShowGenre_pkey" PRIMARY KEY ("tvShowId","genreId")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT,
    "posterPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT,
    "posterPath" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER,
    "plannedAt" TIMESTAMP(3),
    "status" TEXT,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "totalResults" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trending" (
    "id" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "timeWindow" "public"."TimeWindow" NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "posterPath" TEXT,

    CONSTRAINT "Trending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_tmdbId_key" ON "public"."Actor"("tmdbId");

-- CreateIndex
CREATE INDEX "Actor_name_idx" ON "public"."Actor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_tmdbId_key" ON "public"."Genre"("tmdbId");

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "public"."Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "public"."Movie"("tmdbId");

-- CreateIndex
CREATE INDEX "Movie_title_idx" ON "public"."Movie"("title");

-- CreateIndex
CREATE UNIQUE INDEX "TVShow_tmdbId_key" ON "public"."TVShow"("tmdbId");

-- CreateIndex
CREATE INDEX "TVShow_name_idx" ON "public"."TVShow"("name");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "public"."Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_mediaType_tmdbId_key" ON "public"."Favorite"("userId", "mediaType", "tmdbId");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_addedAt_idx" ON "public"."WatchlistItem"("userId", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_mediaType_tmdbId_key" ON "public"."WatchlistItem"("userId", "mediaType", "tmdbId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_createdAt_idx" ON "public"."SearchHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchHistory_query_idx" ON "public"."SearchHistory"("query");

-- CreateIndex
CREATE INDEX "Trending_timeWindow_fetchedAt_idx" ON "public"."Trending"("timeWindow", "fetchedAt");

-- CreateIndex
CREATE INDEX "Trending_rank_idx" ON "public"."Trending"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "Trending_mediaType_tmdbId_timeWindow_fetchedAt_key" ON "public"."Trending"("mediaType", "tmdbId", "timeWindow", "fetchedAt");

-- AddForeignKey
ALTER TABLE "public"."MovieActor" ADD CONSTRAINT "MovieActor_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieActor" ADD CONSTRAINT "MovieActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TVShowActor" ADD CONSTRAINT "TVShowActor_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "public"."TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TVShowActor" ADD CONSTRAINT "TVShowActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieGenre" ADD CONSTRAINT "MovieGenre_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieGenre" ADD CONSTRAINT "MovieGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "public"."Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TVShowGenre" ADD CONSTRAINT "TVShowGenre_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "public"."TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TVShowGenre" ADD CONSTRAINT "TVShowGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "public"."Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
