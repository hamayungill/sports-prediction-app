/*
  Warnings:

  - A unique constraint covering the columns `[category_api_title,depth]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[group_api_title,logic_code]` on the table `groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[league_name]` on the table `leagues` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[league_id,season]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sport_name]` on the table `sports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "categories_category_api_title_depth_key" ON "challenge"."categories"("category_api_title", "depth");

-- CreateIndex
CREATE UNIQUE INDEX "groups_group_api_title_logic_code_key" ON "challenge"."groups"("group_api_title", "logic_code");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_league_name_key" ON "sport"."leagues"("league_name");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_league_id_season_key" ON "sport"."seasons"("league_id", "season");

-- CreateIndex
CREATE UNIQUE INDEX "sports_sport_name_key" ON "sport"."sports"("sport_name");
