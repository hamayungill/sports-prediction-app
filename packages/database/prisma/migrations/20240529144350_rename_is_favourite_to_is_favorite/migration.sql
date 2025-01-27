/*
  Warnings:

  - You are about to drop the column `is_favourite` on the `favorites` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user"."favorites" DROP COLUMN "is_favourite",
ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false;
