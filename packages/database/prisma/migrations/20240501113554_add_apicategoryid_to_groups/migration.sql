/*
  Warnings:

  - You are about to drop the column `api_category_id` on the `categories` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "challenge"."categories_api_category_id_idx";

-- AlterTable
ALTER TABLE "challenge"."categories" DROP COLUMN "api_category_id";

-- AlterTable
ALTER TABLE "challenge"."groups" ADD COLUMN     "api_category_id" JSONB;

-- CreateIndex
CREATE INDEX "categories_category_api_title_category_ext_title_idx" ON "challenge"."categories"("category_api_title", "category_ext_title");
