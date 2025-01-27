/*
  Warnings:

  - The primary key for the `bet_odds` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "sport"."bet_odds_sport_id_game_id_bookmaker_id_api_category_id_odds_idx";

-- AlterTable
ALTER TABLE "sport"."bet_odds" DROP CONSTRAINT "bet_odds_pkey",
ADD CONSTRAINT "bet_odds_pkey" PRIMARY KEY ("sport_id", "game_id", "bookmaker_id", "api_category_id", "odds_type", "spread_val", "threshold", "decimal_odds_value");

-- CreateIndex
CREATE INDEX "bet_odds_sport_id_game_id_bookmaker_id_api_category_id_odds_idx" ON "sport"."bet_odds"("sport_id", "game_id", "bookmaker_id", "api_category_id", "odds_type", "spread_val", "threshold", "decimal_odds_value");
