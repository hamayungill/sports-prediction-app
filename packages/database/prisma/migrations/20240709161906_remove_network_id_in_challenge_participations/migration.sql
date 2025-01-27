/*
  Warnings:

  - You are about to drop the column `network_id` on the `challenge_participations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenge"."challenge_participations" DROP CONSTRAINT "challenge_participations_network_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."challenge_participations" DROP COLUMN "network_id";
