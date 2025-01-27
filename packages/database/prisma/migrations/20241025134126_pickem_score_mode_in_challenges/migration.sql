-- CreateEnum
CREATE TYPE "challenge"."PickemScoreMode" AS ENUM ('OutrightWinner', 'WinnerBySpread');

-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "pickem_score_mode" "challenge"."PickemScoreMode";
