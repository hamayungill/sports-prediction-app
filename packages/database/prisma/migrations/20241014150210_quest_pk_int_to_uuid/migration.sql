/*
  Warnings:

  - The primary key for the `goals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_quest_goals` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "quest"."user_quest_goals" DROP CONSTRAINT "user_quest_goals_goal_id_fkey";

-- AlterTable
ALTER TABLE "quest"."goals" DROP CONSTRAINT "goals_pkey",
ALTER COLUMN "goal_id" DROP DEFAULT,
ALTER COLUMN "goal_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("goal_id");
DROP SEQUENCE IF EXISTS "goals_goal_id_seq";

-- AlterTable
ALTER TABLE "quest"."user_quest_goals" DROP CONSTRAINT "user_quest_goals_pkey",
ALTER COLUMN "user_quest_goal_id" DROP DEFAULT,
ALTER COLUMN "user_quest_goal_id" SET DATA TYPE TEXT,
ALTER COLUMN "goal_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_quest_goals_pkey" PRIMARY KEY ("user_quest_goal_id");
DROP SEQUENCE IF EXISTS "user_quest_goals_user_quest_goal_id_seq";

-- AddForeignKey
ALTER TABLE "quest"."user_quest_goals" ADD CONSTRAINT "user_quest_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "quest"."goals"("goal_id") ON DELETE RESTRICT ON UPDATE CASCADE;
