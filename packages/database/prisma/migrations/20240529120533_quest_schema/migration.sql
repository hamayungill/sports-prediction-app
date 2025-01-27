/*
  Warnings:
  - A unique constraint covering the columns `[api_team_id,sport_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "quest";

-- CreateTable
CREATE TABLE "quest"."quests" (
    "quest_id" TEXT NOT NULL,
    "quest_title" TEXT NOT NULL,
    "status" "sport"."Status" NOT NULL DEFAULT 'Active',
    "description" TEXT NOT NULL,
    "reward" JSONB NOT NULL,
    "max_recurrance" INTEGER NOT NULL,
    "goals" JSONB,
    "qualify_level" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "related_quest_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("quest_id")
);

-- CreateTable
CREATE TABLE "quest"."user_quests" (
    "user_quest_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_progress" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("user_quest_id")
);

-- CreateTable
CREATE TABLE "quest"."quest_reward_ledger" (
    "ledger_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_quest_id" TEXT NOT NULL,
    "points_rate_usd" DECIMAL(65,30) NOT NULL,
    "points" DECIMAL(65,30) NOT NULL,
    "points_balance" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_reward_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quests_quest_id_key" ON "quest"."quests"("quest_id");

-- CreateIndex
CREATE UNIQUE INDEX "quests_quest_title_key" ON "quest"."quests"("quest_title");

-- CreateIndex
CREATE INDEX "quests_quest_title_quest_id_status_idx" ON "quest"."quests"("quest_title", "quest_id", "status");

-- CreateIndex
CREATE INDEX "user_quests_quest_id_user_id_idx" ON "quest"."user_quests"("quest_id", "user_id");

-- CreateIndex
CREATE INDEX "quest_reward_ledger_user_id_user_quest_id_idx" ON "quest"."quest_reward_ledger"("user_id", "user_quest_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_api_team_id_sport_id_key" ON "sport"."teams"("api_team_id", "sport_id");

-- AddForeignKey
ALTER TABLE "quest"."user_quests" ADD CONSTRAINT "user_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quest"."quests"("quest_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest"."user_quests" ADD CONSTRAINT "user_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest"."quest_reward_ledger" ADD CONSTRAINT "quest_reward_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest"."quest_reward_ledger" ADD CONSTRAINT "quest_reward_ledger_user_quest_id_fkey" FOREIGN KEY ("user_quest_id") REFERENCES "quest"."user_quests"("user_quest_id") ON DELETE RESTRICT ON UPDATE CASCADE;
