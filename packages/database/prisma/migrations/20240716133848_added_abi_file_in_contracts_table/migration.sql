-- AlterEnum
ALTER TYPE "sport"."Status" ADD VALUE 'Restricted';

-- AlterTable
ALTER TABLE "challenge"."contracts" ADD COLUMN     "abi_file" JSONB;
