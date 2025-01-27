/*
  Warnings:

  - You are about to drop the column `sportsSportId` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenge"."categories" DROP CONSTRAINT "categories_sportsSportId_fkey";

-- AlterTable
ALTER TABLE "challenge"."categories" DROP COLUMN "sportsSportId";
