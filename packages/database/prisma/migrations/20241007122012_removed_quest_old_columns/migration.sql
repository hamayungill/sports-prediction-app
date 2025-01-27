/*
  Warnings:

  - You are about to drop the column `goals` on the `quests` table. All the data in the column will be lost.
  - You are about to drop the column `goal_progress` on the `user_quests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "quest"."quests" DROP COLUMN "goals";

-- AlterTable
ALTER TABLE "quest"."user_quests" DROP COLUMN "goal_progress";
