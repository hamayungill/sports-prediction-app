-- AlterTable
ALTER TABLE "challenge"."contracts" ADD COLUMN     "note" TEXT;

-- RenameIndex
ALTER INDEX "user"."waitlist_waitlistId_key" RENAME TO "waitlist_waitlist_id_key";
