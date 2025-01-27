-- AlterTable
ALTER TABLE "challenge"."pickem_challenge_lineups" ADD COLUMN     "processing_status" "challenge"."TxnStatus" DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "sport"."games" ALTER COLUMN "processing_status" SET DEFAULT 'Pending';
