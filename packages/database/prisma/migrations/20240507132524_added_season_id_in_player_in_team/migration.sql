/*
  Warnings:

  - The primary key for the `player_in_team` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `season_id` to the `player_in_team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sport"."player_in_team" DROP CONSTRAINT "player_in_team_pkey",
ADD COLUMN     "season_id" INTEGER NOT NULL,
ADD CONSTRAINT "player_in_team_pkey" PRIMARY KEY ("player_id", "team_id", "season_id");

-- AddForeignKey
ALTER TABLE "sport"."player_in_team" ADD CONSTRAINT "player_in_team_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "sport"."seasons"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;
