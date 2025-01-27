/*
  Warnings:

  - You are about to drop the column `sport_id` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenge"."categories" DROP CONSTRAINT "categories_sport_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."categories" DROP COLUMN "sport_id",
ADD COLUMN     "sportsSportId" INTEGER;

-- AddForeignKey
ALTER TABLE "challenge"."categories" ADD CONSTRAINT "categories_sportsSportId_fkey" FOREIGN KEY ("sportsSportId") REFERENCES "sport"."sports"("sport_id") ON DELETE SET NULL ON UPDATE CASCADE;
