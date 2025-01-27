/*
  Warnings:

  - You are about to drop the `scheduled_games` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sport"."scheduled_games" DROP CONSTRAINT "scheduled_games_api_source_id_fkey";

-- DropTable
DROP TABLE "sport"."scheduled_games";
