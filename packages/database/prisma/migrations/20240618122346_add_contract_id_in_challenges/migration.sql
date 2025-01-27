-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "contract_id" INTEGER;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "challenge"."contracts"("contract_id") ON DELETE SET NULL ON UPDATE CASCADE;
