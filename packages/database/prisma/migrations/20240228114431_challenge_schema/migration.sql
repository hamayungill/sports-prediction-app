/*
  Warnings:

  - You are about to drop the column `source_id` on the `games` table. All the data in the column will be lost.
  - The primary key for the `games_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `api_player_id` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the column `api_team_id` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the column `player_stats` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the column `team_stats` on the `games_stats` table. All the data in the column will be lost.
  - You are about to drop the `sources` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `api_source_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Made the column `game_stats` on table `games_stats` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "challenge";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user";

-- CreateEnum
CREATE TYPE "challenge"."ContractType" AS ENUM ('SPORT', 'TOKEN', 'STAKING');

-- CreateEnum
CREATE TYPE "challenge"."Layer" AS ENUM ('L1', 'L2');

-- CreateEnum
CREATE TYPE "challenge"."CategoryDepth" AS ENUM ('WEEK', 'GAME', 'TEAM', 'PLAYER');

-- DropForeignKey
ALTER TABLE "sport"."games" DROP CONSTRAINT "games_source_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_api_player_id_fkey";

-- DropForeignKey
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_api_team_id_fkey";

-- AlterTable
ALTER TABLE "sport"."games" DROP COLUMN "source_id",
ADD COLUMN     "api_source_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sport"."games_stats" DROP CONSTRAINT "games_stats_pkey",
DROP COLUMN "api_player_id",
DROP COLUMN "api_team_id",
DROP COLUMN "player_stats",
DROP COLUMN "team_stats",
ALTER COLUMN "game_stats" SET NOT NULL,
ADD CONSTRAINT "games_stats_pkey" PRIMARY KEY ("api_game_id");

-- DropTable
DROP TABLE "sport"."sources";

-- CreateTable
CREATE TABLE "user"."users" (
    "user_id" TEXT NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "nickname" TEXT NOT NULL,
    "account_status" "sport"."Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sport"."api_sources" (
    "api_source_id" SERIAL NOT NULL,
    "api_source_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_sources_pkey" PRIMARY KEY ("api_source_id")
);

-- CreateTable
CREATE TABLE "sport"."teams_stats" (
    "api_game_id" TEXT NOT NULL,
    "api_team_id" TEXT NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "team_stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_stats_pkey" PRIMARY KEY ("api_game_id","api_team_id")
);

-- CreateTable
CREATE TABLE "sport"."players_stats" (
    "api_game_id" TEXT NOT NULL,
    "api_player_id" TEXT NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "player_stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_stats_pkey" PRIMARY KEY ("api_game_id","api_player_id")
);

-- CreateTable
CREATE TABLE "challenge"."contracts" (
    "contract_id" SERIAL NOT NULL,
    "contract_type" "challenge"."ContractType" NOT NULL,
    "contract_address" TEXT NOT NULL,
    "token_name" TEXT,
    "chain" TEXT,
    "layer" "challenge"."Layer" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("contract_id")
);

-- CreateTable
CREATE TABLE "challenge"."sc_transactions" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sc_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge"."challenges" (
    "challenge_id" SERIAL NOT NULL,
    "challenge_name" TEXT NOT NULL,
    "sc_challenge_id" TEXT,
    "invite_code" TEXT NOT NULL,
    "creator_account_id" TEXT NOT NULL,
    "challenge_mode" INTEGER NOT NULL,
    "challenge_type" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "team_id" INTEGER,
    "player_id" INTEGER,
    "odds_flag" BOOLEAN NOT NULL DEFAULT false,
    "multi_token_flag" BOOLEAN NOT NULL DEFAULT false,
    "challenge_value_qty" DECIMAL(65,30) NOT NULL,
    "challenge_value_usd" DECIMAL(65,30),
    "status" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "final_outcome" INTEGER,
    "challenge_depth" "challenge"."CategoryDepth",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateTable
CREATE TABLE "challenge"."challenge_participations" (
    "participation_id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "challenge_group_id" INTEGER NOT NULL,
    "paid_wallet_address" TEXT NOT NULL,
    "challenge_result_id" INTEGER,
    "odds_flag" BOOLEAN NOT NULL DEFAULT false,
    "participant_odds" DECIMAL(65,30),
    "multi_token_flag" BOOLEAN NOT NULL DEFAULT false,
    "contract_id" INTEGER NOT NULL,
    "exchange_rate" DECIMAL(65,30),
    "participation_value_qty" DECIMAL(65,30) NOT NULL,
    "participation_value_usd" DECIMAL(65,30),
    "participation_win_loss_qty" DECIMAL(65,30),
    "participation_win_loss_usd" DECIMAL(65,30),
    "challenge_depth" "challenge"."CategoryDepth",
    "status" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_participations_pkey" PRIMARY KEY ("participation_id")
);

-- CreateTable
CREATE TABLE "challenge"."challenge_results" (
    "challenge_result_id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "group_id" INTEGER,
    "subgroup_id" INTEGER,
    "spread_points" DECIMAL(65,30),
    "win_criteria" INTEGER,
    "participant_stat_p1" DECIMAL(65,30),
    "participant_stat_p2" DECIMAL(65,30),
    "published_stat_p1" DECIMAL(65,30),
    "published_stat_p2" DECIMAL(65,30),
    "difference_p1" DECIMAL(65,30),
    "difference_p2" DECIMAL(65,30),
    "total_score" DECIMAL(65,30),
    "participant_outcome" INTEGER,
    "final_outcome" INTEGER,
    "participant_position" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_results_pkey" PRIMARY KEY ("challenge_result_id")
);

-- CreateTable
CREATE TABLE "challenge"."week_challenge_lineups" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER,
    "challenge_result_id" INTEGER,
    "pick_team_id" INTEGER,
    "spread_points" DECIMAL(65,30),
    "participant_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "game_id" INTEGER NOT NULL,
    "pick_status" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "week_challenge_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge"."challenge_groups" (
    "challenge_group_id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_groups_pkey" PRIMARY KEY ("challenge_group_id")
);

-- CreateTable
CREATE TABLE "challenge"."challenge_group_participants" (
    "challenge_group_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_group_participants_pkey" PRIMARY KEY ("challenge_group_id","user_id")
);

-- CreateTable
CREATE TABLE "challenge"."categories" (
    "category_id" SERIAL NOT NULL,
    "category_api_title" TEXT NOT NULL,
    "category_ext_title" TEXT NOT NULL,
    "depth" "challenge"."CategoryDepth" NOT NULL,
    "api_category_id" TEXT NOT NULL,
    "challenge_mode" TEXT,
    "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "challenge"."groups" (
    "group_id" SERIAL NOT NULL,
    "group_api_title" TEXT NOT NULL,
    "group_ext_title" TEXT NOT NULL,
    "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "challenge"."subgroups" (
    "subgroup_id" SERIAL NOT NULL,
    "subgroup_api_title" TEXT NOT NULL,
    "subgroup_ext_title" TEXT NOT NULL,
    "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subgroups_pkey" PRIMARY KEY ("subgroup_id")
);

-- CreateTable
CREATE TABLE "challenge"."categories_groups" (
    "category_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "depth" "challenge"."CategoryDepth" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_groups_pkey" PRIMARY KEY ("category_id","group_id")
);

-- CreateTable
CREATE TABLE "challenge"."groups_subgroups" (
    "group_id" INTEGER NOT NULL,
    "subgroup_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_subgroups_pkey" PRIMARY KEY ("group_id","subgroup_id")
);

-- CreateTable
CREATE TABLE "challenge"."contract_data_feed" (
    "contract_data_feed_id" SERIAL NOT NULL,
    "challenge_id" INTEGER,
    "wallet_address" TEXT,
    "participant_outcome" INTEGER,
    "final_outcome" INTEGER,
    "contract_id" INTEGER,
    "token_staked_qty" DECIMAL(65,30),
    "sc_challenge_id" TEXT,
    "transaction_hash" TEXT,
    "event_id" INTEGER,
    "status" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_data_feed_pkey" PRIMARY KEY ("contract_data_feed_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "user"."users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_external_user_id_key" ON "user"."users"("external_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "user"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "user"."users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "user"."users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_invite_code_key" ON "challenge"."challenges"("invite_code");

-- AddForeignKey
ALTER TABLE "sport"."games" ADD CONSTRAINT "games_api_source_id_fkey" FOREIGN KEY ("api_source_id") REFERENCES "sport"."api_sources"("api_source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams_stats" ADD CONSTRAINT "teams_stats_api_game_id_fkey" FOREIGN KEY ("api_game_id") REFERENCES "sport"."games"("api_game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams_stats" ADD CONSTRAINT "teams_stats_api_team_id_fkey" FOREIGN KEY ("api_team_id") REFERENCES "sport"."teams"("api_team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."teams_stats" ADD CONSTRAINT "teams_stats_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players_stats" ADD CONSTRAINT "players_stats_api_game_id_fkey" FOREIGN KEY ("api_game_id") REFERENCES "sport"."games"("api_game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players_stats" ADD CONSTRAINT "players_stats_api_player_id_fkey" FOREIGN KEY ("api_player_id") REFERENCES "sport"."players"("api_player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."players_stats" ADD CONSTRAINT "players_stats_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."sc_transactions" ADD CONSTRAINT "sc_transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "challenge"."contracts"("contract_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_creator_account_id_fkey" FOREIGN KEY ("creator_account_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport"."teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "sport"."players"("player_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_challenge_group_id_fkey" FOREIGN KEY ("challenge_group_id") REFERENCES "challenge"."challenge_groups"("challenge_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_paid_wallet_address_fkey" FOREIGN KEY ("paid_wallet_address") REFERENCES "user"."users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_challenge_result_id_fkey" FOREIGN KEY ("challenge_result_id") REFERENCES "challenge"."challenge_results"("challenge_result_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "challenge"."contracts"("contract_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_results" ADD CONSTRAINT "challenge_results_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_results" ADD CONSTRAINT "challenge_results_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "challenge"."categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_results" ADD CONSTRAINT "challenge_results_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "challenge"."groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_results" ADD CONSTRAINT "challenge_results_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "challenge"."subgroups"("subgroup_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" ADD CONSTRAINT "week_challenge_lineups_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" ADD CONSTRAINT "week_challenge_lineups_challenge_result_id_fkey" FOREIGN KEY ("challenge_result_id") REFERENCES "challenge"."challenge_results"("challenge_result_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" ADD CONSTRAINT "week_challenge_lineups_pick_team_id_fkey" FOREIGN KEY ("pick_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."week_challenge_lineups" ADD CONSTRAINT "week_challenge_lineups_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_group_participants" ADD CONSTRAINT "challenge_group_participants_challenge_group_id_fkey" FOREIGN KEY ("challenge_group_id") REFERENCES "challenge"."challenge_groups"("challenge_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_group_participants" ADD CONSTRAINT "challenge_group_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."categories_groups" ADD CONSTRAINT "categories_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "challenge"."categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."categories_groups" ADD CONSTRAINT "categories_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "challenge"."groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."groups_subgroups" ADD CONSTRAINT "groups_subgroups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "challenge"."groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."groups_subgroups" ADD CONSTRAINT "groups_subgroups_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "challenge"."subgroups"("subgroup_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."contract_data_feed" ADD CONSTRAINT "contract_data_feed_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."contract_data_feed" ADD CONSTRAINT "contract_data_feed_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "user"."users"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."contract_data_feed" ADD CONSTRAINT "contract_data_feed_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "challenge"."contracts"("contract_id") ON DELETE SET NULL ON UPDATE CASCADE;
