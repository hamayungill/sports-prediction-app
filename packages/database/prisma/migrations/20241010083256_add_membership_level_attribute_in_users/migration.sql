-- AlterTable
ALTER TABLE "user"."users" ADD COLUMN     "membership_level_id" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "user"."users" ADD CONSTRAINT "users_membership_level_id_fkey" FOREIGN KEY ("membership_level_id") REFERENCES "user"."membership_levels"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;
