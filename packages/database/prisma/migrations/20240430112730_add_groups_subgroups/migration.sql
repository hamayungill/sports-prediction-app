-- AlterTable
ALTER TABLE "challenge"."groups" ADD COLUMN     "group_attributes" JSONB,
ADD COLUMN     "logic_code" TEXT;

-- CreateTable
CREATE TABLE "challenge"."groups_subgroups" (
    "group_id" INTEGER NOT NULL,
    "subgroup_id" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_subgroups_group_id_subgroup_id_key" ON "challenge"."groups_subgroups"("group_id", "subgroup_id");

-- AddForeignKey
ALTER TABLE "challenge"."groups_subgroups" ADD CONSTRAINT "groups_subgroups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "challenge"."groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."groups_subgroups" ADD CONSTRAINT "groups_subgroups_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "challenge"."subgroups"("subgroup_id") ON DELETE RESTRICT ON UPDATE CASCADE;
