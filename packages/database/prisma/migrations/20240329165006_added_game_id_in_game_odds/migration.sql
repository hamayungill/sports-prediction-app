/*
  Warnings:

  - Added the required column `game_id` to the `game_odds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."game_odds" ADD COLUMN     "game_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "challenge"."game_odds" ADD CONSTRAINT "game_odds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;
