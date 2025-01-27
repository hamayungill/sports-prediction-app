/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `referral_codes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_user_id_key" ON "user"."referral_codes"("user_id");
