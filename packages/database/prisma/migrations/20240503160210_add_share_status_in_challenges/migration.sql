-- CreateEnum
CREATE TYPE "challenge"."ShareStatus" AS ENUM ('Sent', 'Converted', 'Approved', 'Rejected');

-- AlterEnum
ALTER TYPE "challenge"."ChallengeMode" ADD VALUE 'Partial';

-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "share_status" "challenge"."ShareStatus";
