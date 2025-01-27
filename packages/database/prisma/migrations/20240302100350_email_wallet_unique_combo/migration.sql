/*
  Warnings:

  - A unique constraint covering the columns `[email,wallet_address]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user"."users_email_key";

-- AlterTable
ALTER TABLE "user"."users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_wallet_address_key" ON "user"."users"("email", "wallet_address");
