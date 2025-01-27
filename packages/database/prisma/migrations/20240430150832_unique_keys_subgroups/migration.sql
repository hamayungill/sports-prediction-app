/*
  Warnings:

  - A unique constraint covering the columns `[subgroup_api_title,subgroup_ext_title]` on the table `subgroups` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subgroups_subgroup_api_title_subgroup_ext_title_key" ON "challenge"."subgroups"("subgroup_api_title", "subgroup_ext_title");
