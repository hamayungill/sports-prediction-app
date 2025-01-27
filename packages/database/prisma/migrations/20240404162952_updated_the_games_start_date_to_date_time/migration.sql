/*
  Warnings:

  - The `start_date` column on the `games` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "sport"."games" DROP COLUMN "start_date",
ADD COLUMN     "start_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
