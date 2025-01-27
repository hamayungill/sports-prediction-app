/*
  Warnings:

  - Added the required column `logo` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."contracts" ADD COLUMN     "logo" TEXT NOT NULL,
ADD COLUMN     "status" "sport"."Status" NOT NULL DEFAULT 'Active';
