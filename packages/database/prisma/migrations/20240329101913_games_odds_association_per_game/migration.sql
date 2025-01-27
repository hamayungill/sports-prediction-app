/*
  Warnings:

  - The primary key for the `game_odds` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `away_team` on the `game_odds` table. All the data in the column will be lost.
  - You are about to drop the column `game_odds_id` on the `game_odds` table. All the data in the column will be lost.
  - You are about to drop the column `home_team` on the `game_odds` table. All the data in the column will be lost.
  - Added the required column `away_team_id` to the `game_odds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `away_team_name` to the `game_odds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_team_id` to the `game_odds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_team_name` to the `game_odds` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "challenge"."game_odds_home_team_away_team_idx";

-- AlterTable
ALTER TABLE "challenge"."game_odds" DROP CONSTRAINT "game_odds_pkey",
DROP COLUMN "away_team",
DROP COLUMN "game_odds_id",
DROP COLUMN "home_team",
ADD COLUMN     "away_team_id" INTEGER NOT NULL,
ADD COLUMN     "away_team_name" TEXT NOT NULL,
ADD COLUMN     "home_team_id" INTEGER NOT NULL,
ADD COLUMN     "home_team_name" TEXT NOT NULL,
ADD CONSTRAINT "game_odds_pkey" PRIMARY KEY ("home_team_name", "away_team_name", "game_date");

-- CreateIndex
CREATE INDEX "game_odds_home_team_name_away_team_name_game_date_idx" ON "challenge"."game_odds"("home_team_name", "away_team_name", "game_date");

-- AddForeignKey
ALTER TABLE "challenge"."game_odds" ADD CONSTRAINT "game_odds_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."game_odds" ADD CONSTRAINT "game_odds_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;
