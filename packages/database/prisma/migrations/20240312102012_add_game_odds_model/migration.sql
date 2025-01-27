/*
  Warnings:

  - You are about to drop the column `event_id` on the `contract_data_feed` table. All the data in the column will be lost.
  - The `status` column on the `contract_data_feed` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `week_challenge_lineups` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "challenge"."TxnStatus" AS ENUM ('Pending', 'InProgress', 'Success', 'Failed');

-- DropForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" DROP CONSTRAINT "week_challenge_lineups_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" DROP CONSTRAINT "week_challenge_lineups_challenge_result_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" DROP CONSTRAINT "week_challenge_lineups_game_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" DROP CONSTRAINT "week_challenge_lineups_pick_team_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "processing_status" "challenge"."TxnStatus";

-- AlterTable
ALTER TABLE "challenge"."contract_data_feed" DROP COLUMN "event_id",
ADD COLUMN     "event" "challenge"."CdfEvent",
DROP COLUMN "status",
ADD COLUMN     "status" "challenge"."TxnStatus";

-- AlterTable
ALTER TABLE "sport"."sports" ADD COLUMN     "feature_flags" JSONB;

-- DropTable
DROP TABLE "challenge"."week_challenge_lineups";

-- DropEnum
DROP TYPE "challenge"."CdfTxnStatus";

-- CreateTable
CREATE TABLE "sport"."team_in_game" (
    "team_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_in_game_pkey" PRIMARY KEY ("team_id","game_id")
);

-- CreateTable
CREATE TABLE "challenge"."pickem_challenge_lineups" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER,
    "challenge_result_id" INTEGER,
    "pick_team_id" INTEGER,
    "spread_points" DECIMAL(65,30),
    "participant_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "game_id" INTEGER NOT NULL,
    "pick_status" "sport"."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickem_challenge_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge"."game_odds" (
    "game_odds_id" SERIAL NOT NULL,
    "game_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "bookmaker_title" TEXT,
    "odds_type" TEXT,
    "odds_value" DECIMAL(65,30),
    "api_source_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_odds_pkey" PRIMARY KEY ("game_odds_id")
);

-- CreateIndex
CREATE INDEX "pickem_challenge_lineups_challenge_result_id_game_id_idx" ON "challenge"."pickem_challenge_lineups"("challenge_result_id", "game_id");

-- CreateIndex
CREATE INDEX "game_odds_home_team_away_team_idx" ON "challenge"."game_odds"("home_team", "away_team");

-- CreateIndex
CREATE INDEX "challenge_participations_challenge_id_idx" ON "challenge"."challenge_participations"("challenge_id");

-- CreateIndex
CREATE INDEX "challenge_participations_paid_wallet_address_idx" ON "challenge"."challenge_participations"("paid_wallet_address");

-- CreateIndex
CREATE INDEX "challenge_results_challenge_id_idx" ON "challenge"."challenge_results"("challenge_id");

-- CreateIndex
CREATE INDEX "challenges_creator_account_id_idx" ON "challenge"."challenges"("creator_account_id");

-- CreateIndex
CREATE INDEX "contract_data_feed_challenge_id_idx" ON "challenge"."contract_data_feed"("challenge_id");

-- CreateIndex
CREATE INDEX "games_api_game_id_idx" ON "sport"."games"("api_game_id");

-- CreateIndex
CREATE INDEX "games_stats_api_game_id_idx" ON "sport"."games_stats"("api_game_id");

-- CreateIndex
CREATE INDEX "players_api_player_id_idx" ON "sport"."players"("api_player_id");

-- CreateIndex
CREATE INDEX "players_stats_api_player_id_idx" ON "sport"."players_stats"("api_player_id");

-- CreateIndex
CREATE INDEX "team_in_league_team_id_idx" ON "sport"."team_in_league"("team_id");

-- CreateIndex
CREATE INDEX "teams_api_team_id_idx" ON "sport"."teams"("api_team_id");

-- CreateIndex
CREATE INDEX "teams_stats_api_team_id_idx" ON "sport"."teams_stats"("api_team_id");

-- AddForeignKey
ALTER TABLE "sport"."team_in_game" ADD CONSTRAINT "team_in_game_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."team_in_game" ADD CONSTRAINT "team_in_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_challenge_result_id_fkey" FOREIGN KEY ("challenge_result_id") REFERENCES "challenge"."challenge_results"("challenge_result_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_pick_team_id_fkey" FOREIGN KEY ("pick_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."game_odds" ADD CONSTRAINT "game_odds_api_source_id_fkey" FOREIGN KEY ("api_source_id") REFERENCES "sport"."api_sources"("api_source_id") ON DELETE RESTRICT ON UPDATE CASCADE;
