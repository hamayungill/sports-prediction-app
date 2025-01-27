/*
  Warnings:

  - You are about to drop the column `group_id` on the `subgroups` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenge"."subgroups" DROP CONSTRAINT "subgroups_group_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."subgroups" DROP COLUMN "group_id";
