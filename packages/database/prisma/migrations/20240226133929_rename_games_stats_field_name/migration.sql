/*
  Warnings:

  - The primary key for the `games_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `game_id` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the column `player_id` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `games_stats` table. All the data in the column will be lost.
  - Added the required column `api_game_id` to the `games_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `api_player_id` to the `games_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `api_team_id` to the `games_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_game_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_player_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_team_id_fkey";

-- AlterTable
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_pkey",
DROP COLUMN "game_id",
DROP COLUMN "player_id",
DROP COLUMN "team_id",
ADD COLUMN     "api_game_id" TEXT NOT NULL,
ADD COLUMN     "api_player_id" TEXT NOT NULL,
ADD COLUMN     "api_team_id" TEXT NOT NULL,
ADD CONSTRAINT "games_stats_pkey" PRIMARY KEY ("api_game_id", "api_team_id", "api_player_id");

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_api_game_id_fkey" FOREIGN KEY ("api_game_id") REFERENCES "sport"."games"("api_game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_api_team_id_fkey" FOREIGN KEY ("api_team_id") REFERENCES "sport"."teams"("api_team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."games_stats" ADD CONSTRAINT "games_stats_api_player_id_fkey" FOREIGN KEY ("api_player_id") REFERENCES "sport"."players"("api_player_id") ON DELETE RESTRICT ON UPDATE CASCADE;
