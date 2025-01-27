-- DropIndex
DROP INDEX "sport"."games_api_game_id_idx";

-- DropIndex
DROP INDEX "sport"."games_stats_api_game_id_idx";

-- DropIndex
DROP INDEX "sport"."players_api_player_id_idx";

-- DropIndex
DROP INDEX "sport"."players_stats_api_player_id_idx";

-- DropIndex
DROP INDEX "sport"."teams_api_team_id_idx";

-- DropIndex
DROP INDEX "sport"."teams_stats_api_team_id_idx";

-- CreateIndex
CREATE INDEX "games_api_game_id_sport_id_idx" ON "sport"."games"("api_game_id", "sport_id");

-- CreateIndex
CREATE INDEX "games_stats_api_game_id_sport_id_idx" ON "sport"."games_stats"("api_game_id", "sport_id");

-- CreateIndex
CREATE INDEX "players_api_player_id_sport_id_idx" ON "sport"."players"("api_player_id", "sport_id");

-- CreateIndex
CREATE INDEX "players_stats_sport_id_api_game_id_api_player_id_idx" ON "sport"."players_stats"("sport_id", "api_game_id", "api_player_id");

-- CreateIndex
CREATE INDEX "teams_api_team_id_sport_id_idx" ON "sport"."teams"("api_team_id", "sport_id");

-- CreateIndex
CREATE INDEX "teams_stats_sport_id_api_game_id_api_team_id_idx" ON "sport"."teams_stats"("sport_id", "api_game_id", "api_team_id");
