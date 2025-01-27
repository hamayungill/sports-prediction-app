/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `referral_codes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user"."users" ADD COLUMN     "referrer_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_referral_code_key" ON "user"."referral_codes"("referral_code");

-- AddForeignKey
ALTER TABLE "user"."users" ADD CONSTRAINT "users_referrer_code_fkey" FOREIGN KEY ("referrer_code") REFERENCES "user"."referral_codes"("referral_code") ON DELETE SET NULL ON UPDATE CASCADE;
