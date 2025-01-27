/*
  Warnings:

  - You are about to drop the column `logo` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `web3SocketUrl` on the `contracts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "challenge"."contracts" DROP COLUMN "logo",
DROP COLUMN "web3SocketUrl",
ADD COLUMN     "resource_url" TEXT;
