-- AlterTable
ALTER TABLE "challenge"."challenge_results" ADD COLUMN     "sport_id" INTEGER;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_results" ADD CONSTRAINT "challenge_results_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE SET NULL ON UPDATE CASCADE;
