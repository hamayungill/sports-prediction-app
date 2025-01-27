/*
  Warnings:

  - The values [Week] on the enum `CategoryDepth` will be removed. If these variants are still used in the database, this will fail.
  - The values [Draw] on the enum `Outcome` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `challenge_id` on table `pickem_challenge_lineups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pick_team_id` on table `pickem_challenge_lineups` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "challenge"."CategoryDepth_new" AS ENUM ('Pickem', 'DayPickem', 'WeekPickem', 'Game', 'Team', 'Player');
ALTER TABLE "challenge"."challenges" ALTER COLUMN "challenge_depth" TYPE "challenge"."CategoryDepth_new" USING ("challenge_depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."challenge_participations" ALTER COLUMN "challenge_depth" TYPE "challenge"."CategoryDepth_new" USING ("challenge_depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."categories" ALTER COLUMN "depth" TYPE "challenge"."CategoryDepth_new" USING ("depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."categories_groups" ALTER COLUMN "depth" TYPE "challenge"."CategoryDepth_new" USING ("depth"::text::"challenge"."CategoryDepth_new");
ALTER TYPE "challenge"."CategoryDepth" RENAME TO "CategoryDepth_old";
ALTER TYPE "challenge"."CategoryDepth_new" RENAME TO "CategoryDepth";
DROP TYPE "challenge"."CategoryDepth_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "challenge"."Outcome_new" AS ENUM ('Win', 'Lose', 'CancelledOrDraw');
ALTER TABLE "challenge"."challenges" ALTER COLUMN "final_outcome" TYPE "challenge"."Outcome_new" USING ("final_outcome"::text::"challenge"."Outcome_new");
ALTER TABLE "challenge"."challenge_results" ALTER COLUMN "participant_outcome" TYPE "challenge"."Outcome_new" USING ("participant_outcome"::text::"challenge"."Outcome_new");
ALTER TABLE "challenge"."challenge_results" ALTER COLUMN "final_outcome" TYPE "challenge"."Outcome_new" USING ("final_outcome"::text::"challenge"."Outcome_new");
ALTER TABLE "challenge"."contract_data_feed" ALTER COLUMN "participant_outcome" TYPE "challenge"."Outcome_new" USING ("participant_outcome"::text::"challenge"."Outcome_new");
ALTER TABLE "challenge"."contract_data_feed" ALTER COLUMN "final_outcome" TYPE "challenge"."Outcome_new" USING ("final_outcome"::text::"challenge"."Outcome_new");
ALTER TYPE "challenge"."Outcome" RENAME TO "Outcome_old";
ALTER TYPE "challenge"."Outcome_new" RENAME TO "Outcome";
DROP TYPE "challenge"."Outcome_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" DROP CONSTRAINT "pickem_challenge_lineups_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" DROP CONSTRAINT "pickem_challenge_lineups_pick_team_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "pickem" TEXT;

-- AlterTable
ALTER TABLE "challenge"."pickem_challenge_lineups" ALTER COLUMN "challenge_id" SET NOT NULL,
ALTER COLUMN "pick_team_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "sport"."games" ADD COLUMN     "processing_status" "challenge"."TxnStatus";

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD CONSTRAINT "pickem_challenge_lineups_pick_team_id_fkey" FOREIGN KEY ("pick_team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;
