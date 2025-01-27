/*
  Warnings:

  - The primary key for the `categories_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "challenge"."categories_groups" DROP CONSTRAINT "categories_groups_pkey",
ADD COLUMN     "sport_id" INTEGER NOT NULL DEFAULT 1,
ADD CONSTRAINT "categories_groups_pkey" PRIMARY KEY ("category_id", "group_id", "sport_id");

-- AddForeignKey
ALTER TABLE "challenge"."categories_groups" ADD CONSTRAINT "categories_groups_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
