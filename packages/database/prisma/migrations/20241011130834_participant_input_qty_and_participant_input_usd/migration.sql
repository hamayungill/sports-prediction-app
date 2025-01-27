-- AlterTable
ALTER TABLE "challenge"."challenge_participations" ADD COLUMN     "participant_input_qty" DECIMAL(65,30),
ADD COLUMN     "participant_input_usd" DECIMAL(65,30);
