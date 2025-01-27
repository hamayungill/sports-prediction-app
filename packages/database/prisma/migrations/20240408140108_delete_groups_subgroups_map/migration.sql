/*
  Warnings:

  - You are about to drop the `groups_subgroups` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `group_id` to the `subgroups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "challenge"."groups_subgroups" DROP CONSTRAINT "groups_subgroups_group_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge"."groups_subgroups" DROP CONSTRAINT "groups_subgroups_subgroup_id_fkey";

-- AlterTable
ALTER TABLE "challenge"."subgroups" ADD COLUMN     "group_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "challenge"."groups_subgroups";

-- AddForeignKey
ALTER TABLE "challenge"."subgroups" ADD CONSTRAINT "subgroups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "challenge"."groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;
