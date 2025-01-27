-- AlterTable
ALTER TABLE "user"."users" ADD COLUMN     "meta" JSONB DEFAULT '{"terms":{"v1_0_0":false},"enabledNotification":false}';
