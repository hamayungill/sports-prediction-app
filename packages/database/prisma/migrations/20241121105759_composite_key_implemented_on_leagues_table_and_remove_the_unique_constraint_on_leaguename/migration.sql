/*
  Warnings:

  - A unique constraint covering the columns `[sport_id,league_name]` on the table `leagues` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "sport"."leagues_league_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "leagues_sport_id_league_name_key" ON "sport"."leagues"("sport_id", "league_name");
