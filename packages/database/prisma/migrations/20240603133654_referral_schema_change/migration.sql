/*
  Warnings:

  - You are about to drop the column `referrer_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `referral_codes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[handle]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `handle` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referral_code` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user"."referral_codes" DROP CONSTRAINT "referral_codes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user"."users" DROP CONSTRAINT "users_referrer_code_fkey";

-- AlterTable
ALTER TABLE "user"."users" DROP COLUMN "referrer_code",
ADD COLUMN     "handle" TEXT NOT NULL,
ADD COLUMN     "referral_code" TEXT NOT NULL,
ADD COLUMN     "referrer_user_id" TEXT;

-- DropTable
DROP TABLE "user"."referral_codes";

-- CreateIndex
CREATE UNIQUE INDEX "users_handle_key" ON "user"."users"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "user"."users"("referral_code");

-- AddForeignKey
ALTER TABLE "user"."users" ADD CONSTRAINT "users_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "user"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
