-- AlterTable
ALTER TABLE "quest"."user_quests" ALTER COLUMN "goal_progress" DROP NOT NULL;

-- CreateTable
CREATE TABLE "quest"."goals" (
    "goal_id" SERIAL NOT NULL,
    "quest_id" TEXT NOT NULL,
    "goal_source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "negative_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("goal_id")
);

-- CreateTable
CREATE TABLE "quest"."user_quest_goals" (
    "user_quest_goal_id" SERIAL NOT NULL,
    "user_quest_id" TEXT NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quest_goals_pkey" PRIMARY KEY ("user_quest_goal_id")
);

-- CreateIndex
CREATE INDEX "goals_goal_source_idx" ON "quest"."goals"("goal_source");

-- CreateIndex
CREATE INDEX "goals_negative_source_idx" ON "quest"."goals"("negative_source");

-- CreateIndex
CREATE INDEX "goals_quest_id_idx" ON "quest"."goals"("quest_id");

-- CreateIndex
CREATE UNIQUE INDEX "goals_quest_id_goal_source_key" ON "quest"."goals"("quest_id", "goal_source");

-- CreateIndex
CREATE INDEX "user_quest_goals_user_quest_id_goal_id_idx" ON "quest"."user_quest_goals"("user_quest_id", "goal_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_quest_goals_user_quest_id_goal_id_key" ON "quest"."user_quest_goals"("user_quest_id", "goal_id");

-- AddForeignKey
ALTER TABLE "quest"."goals" ADD CONSTRAINT "goals_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quest"."quests"("quest_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest"."user_quest_goals" ADD CONSTRAINT "user_quest_goals_user_quest_id_fkey" FOREIGN KEY ("user_quest_id") REFERENCES "quest"."user_quests"("user_quest_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest"."user_quest_goals" ADD CONSTRAINT "user_quest_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "quest"."goals"("goal_id") ON DELETE RESTRICT ON UPDATE CASCADE;
