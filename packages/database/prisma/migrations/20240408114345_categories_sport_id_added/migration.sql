/*
  Warnings:

  - The `challenge_mode` column on the `categories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `sport_id` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."categories" ADD COLUMN     "sport_id" INTEGER NOT NULL,
DROP COLUMN "challenge_mode",
ADD COLUMN     "challenge_mode" JSON;

-- AddForeignKey
ALTER TABLE "challenge"."categories" ADD CONSTRAINT "categories_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
