/*
  Warnings:

  - Added the required column `chain` to the `challenge_participations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `layer` to the `challenge_participations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" DROP CONSTRAINT "pickem_challenge_lineups_pick_team_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."challenge_participations" ADD COLUMN     "chain" TEXT NOT NULL,
ADD COLUMN     "layer" "challenge"."Layer" NOT NULL;

-- AlterTable
ALTER TABLE "challenge"."pickem_challenge_lineups" ALTER COLUMN "pick_team_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_pick_team_id_fkey" FOREIGN KEY ("pick_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
