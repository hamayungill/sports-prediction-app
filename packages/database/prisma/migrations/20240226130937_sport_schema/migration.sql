-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sport";

-- CreateEnum
CREATE TYPE "sport"."SportsStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "sport"."LeagueStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "sport"."SeasonsStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "sport"."TeamsStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "sport"."sources" (
    "source_id" SERIAL NOT NULL,
    "source_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "sport"."sports" (
    "sport_id" SERIAL NOT NULL,
    "sport_name" VARCHAR(20) NOT NULL,
    "status" "sport"."SportsStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("sport_id")
);

-- CreateTable
CREATE TABLE "sport"."leagues" (
    "league_id" SERIAL NOT NULL,
    "league_name" TEXT NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "status" "sport"."LeagueStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("league_id")
);

-- CreateTable
CREATE TABLE "sport"."seasons" (
    "season_id" SERIAL NOT NULL,
    "league_id" INTEGER,
    "status" "sport"."SeasonsStatus" NOT NULL,
    "season" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "sport"."games" (
    "game_id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "api_game_id" TEXT NOT NULL,
    "data" JSONB,
    "source_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "sport"."teams" (
    "team_id" SERIAL NOT NULL,
    "team_name" TEXT NOT NULL,
    "api_team_id" TEXT NOT NULL,
    "status" "sport"."TeamsStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "sport"."players" (
    "player_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "api_player_id" TEXT NOT NULL,
    "api_team_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "sport"."player_in_sport" (
    "player_id" INTEGER NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_in_sport_pkey" PRIMARY KEY ("player_id","sport_id")
);

-- CreateTable
CREATE TABLE "sport"."player_in_team" (
    "player_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_in_team_pkey" PRIMARY KEY ("player_id","team_id")
);

-- CreateTable
CREATE TABLE "sport"."games_stats" (
    "game_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "game_stats" JSONB,
    "team_stats" JSONB,
    "player_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_stats_pkey" PRIMARY KEY ("game_id","team_id","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_api_game_id_key" ON "sport"."games"("api_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_api_team_id_key" ON "sport"."teams"("api_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_api_player_id_key" ON "sport"."players"("api_player_id");

-- AddForeignKey
ALTER TABLE "sport"."leagues" ADD CONSTRAINT "leagues_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."seasons" ADD CONSTRAINT "seasons_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "sport"."leagues"("league_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games" ADD CONSTRAINT "games_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "sport"."seasons"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games" ADD CONSTRAINT "games_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sport"."sources"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players" ADD CONSTRAINT "players_api_team_id_fkey" FOREIGN KEY ("api_team_id") REFERENCES "sport"."teams"("api_team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."player_in_sport" ADD CONSTRAINT "player_in_sport_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "sport"."players"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."player_in_sport" ADD CONSTRAINT "player_in_sport_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."player_in_team" ADD CONSTRAINT "player_in_team_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "sport"."players"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."player_in_team" ADD CONSTRAINT "player_in_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("api_game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport"."teams"("api_team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "sport"."players"("api_player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
