/*
  Warnings:

  - The primary key for the `games_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `players_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `teams_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[sport_id,api_game_id]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sport_id,api_player_id]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sport_id,api_team_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sport_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport_id` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport_id` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_api_game_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."players" DROP CONSTRAINT "players_api_team_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."players_stats" DROP CONSTRAINT "players_stats_api_game_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."players_stats" DROP CONSTRAINT "players_stats_api_player_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."teams_stats" DROP CONSTRAINT "teams_stats_api_game_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."teams_stats" DROP CONSTRAINT "teams_stats_api_team_id_fkey";

-- DropIndex
DROP INDEX "sport"."games_api_game_id_key";

-- DropIndex
DROP INDEX "sport"."players_api_player_id_key";

-- DropIndex
DROP INDEX "sport"."teams_api_team_id_key";

-- AlterTable
ALTER TABLE "sport"."games" ADD COLUMN     "sport_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_pkey",
ADD CONSTRAINT "games_stats_pkey" PRIMARY KEY ("api_game_id", "sport_id");

-- AlterTable
ALTER TABLE "sport"."players" ADD COLUMN     "sport_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sport"."players_stats" DROP CONSTRAINT "players_stats_pkey",
ADD CONSTRAINT "players_stats_pkey" PRIMARY KEY ("sport_id", "api_game_id", "api_player_id");

-- AlterTable
ALTER TABLE "sport"."teams" ADD COLUMN     "sport_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sport"."teams_stats" DROP CONSTRAINT "teams_stats_pkey",
ADD CONSTRAINT "teams_stats_pkey" PRIMARY KEY ("sport_id", "api_game_id", "api_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "games_sport_id_api_game_id_key" ON "sport"."games"("sport_id", "api_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_sport_id_api_player_id_key" ON "sport"."players"("sport_id", "api_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_sport_id_api_team_id_key" ON "sport"."teams"("sport_id", "api_team_id");

-- AddForeignKey
ALTER TABLE "sport"."games" ADD CONSTRAINT "games_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams" ADD CONSTRAINT "teams_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players" ADD CONSTRAINT "players_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players" ADD CONSTRAINT "players_api_team_id_sport_id_fkey" FOREIGN KEY ("api_team_id", "sport_id") REFERENCES "sport"."teams"("api_team_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_api_game_id_sport_id_fkey" FOREIGN KEY ("api_game_id", "sport_id") REFERENCES "sport"."games"("api_game_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams_stats" ADD CONSTRAINT "teams_stats_api_game_id_sport_id_fkey" FOREIGN KEY ("api_game_id", "sport_id") REFERENCES "sport"."games"("api_game_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams_stats" ADD CONSTRAINT "teams_stats_api_team_id_sport_id_fkey" FOREIGN KEY ("api_team_id", "sport_id") REFERENCES "sport"."teams"("api_team_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players_stats" ADD CONSTRAINT "players_stats_api_game_id_sport_id_fkey" FOREIGN KEY ("api_game_id", "sport_id") REFERENCES "sport"."games"("api_game_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players_stats" ADD CONSTRAINT "players_stats_api_player_id_sport_id_fkey" FOREIGN KEY ("api_player_id", "sport_id") REFERENCES "sport"."players"("api_player_id", "sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
