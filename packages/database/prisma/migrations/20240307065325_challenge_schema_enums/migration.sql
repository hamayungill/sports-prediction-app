/*
  Warnings:

  - The values [WEEK,GAME,TEAM,PLAYER] on the enum `CategoryDepth` will be removed. If these variants are still used in the database, this will fail.
  - The values [SPORT,TOKEN,STAKING] on the enum `ContractType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,INACTIVE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `challenge_participations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `participant_outcome` column on the `challenge_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `final_outcome` column on the `challenge_results` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `challenges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `final_outcome` column on the `challenges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `participant_outcome` column on the `contract_data_feed` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `final_outcome` column on the `contract_data_feed` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `event_id` column on the `contract_data_feed` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `contract_data_feed` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `challenge_mode` on the `challenges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `challenge_type` on the `challenges` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pick_status` on the `week_challenge_lineups` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "challenge"."ChallengeStatus" AS ENUM ('AuthPending', 'Pending', 'Ready', 'InProgress', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "challenge"."ChallengeParticipationStatus" AS ENUM ('Active', 'Inactive', 'Withdrawn');

-- CreateEnum
CREATE TYPE "challenge"."Outcome" AS ENUM ('Win', 'Lose', 'Draw');

-- CreateEnum
CREATE TYPE "challenge"."ChallengeMode" AS ENUM ('OneVsOne', 'Group');

-- CreateEnum
CREATE TYPE "challenge"."ChallengeType" AS ENUM ('Private', 'Public');

-- CreateEnum
CREATE TYPE "challenge"."CdfEvent" AS ENUM ('Create', 'Join', 'InProgress', 'Withdraw', 'CancelledOrDraw', 'OutcomePublished');

-- CreateEnum
CREATE TYPE "challenge"."CdfTxnStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- AlterEnum
BEGIN;
CREATE TYPE "challenge"."CategoryDepth_new" AS ENUM ('Week', 'Game', 'Team', 'Player');
ALTER TABLE "challenge"."challenges" ALTER COLUMN "challenge_depth" TYPE "challenge"."CategoryDepth_new" USING ("challenge_depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."challenge_participations" ALTER COLUMN "challenge_depth" TYPE "challenge"."CategoryDepth_new" USING ("challenge_depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."categories" ALTER COLUMN "depth" TYPE "challenge"."CategoryDepth_new" USING ("depth"::text::"challenge"."CategoryDepth_new");
ALTER TABLE "challenge"."categories_groups" ALTER COLUMN "depth" TYPE "challenge"."CategoryDepth_new" USING ("depth"::text::"challenge"."CategoryDepth_new");
ALTER TYPE "challenge"."CategoryDepth" RENAME TO "CategoryDepth_old";
ALTER TYPE "challenge"."CategoryDepth_new" RENAME TO "CategoryDepth";
DROP TYPE "challenge"."CategoryDepth_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "challenge"."ContractType_new" AS ENUM ('Sport', 'Token', 'Staking');
ALTER TABLE "challenge"."contracts" ALTER COLUMN "contract_type" TYPE "challenge"."ContractType_new" USING ("contract_type"::text::"challenge"."ContractType_new");
ALTER TYPE "challenge"."ContractType" RENAME TO "ContractType_old";
ALTER TYPE "challenge"."ContractType_new" RENAME TO "ContractType";
DROP TYPE "challenge"."ContractType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "sport"."Status_new" AS ENUM ('Active', 'Inactive');
ALTER TABLE "challenge"."subgroups" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sport"."leagues" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "challenge"."categories" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user"."users" ALTER COLUMN "account_status" DROP DEFAULT;
ALTER TABLE "sport"."teams" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "challenge"."groups" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sport"."sports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sport"."seasons" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user"."users" ALTER COLUMN "account_status" TYPE "sport"."Status_new" USING ("account_status"::text::"sport"."Status_new");
ALTER TABLE "sport"."sports" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "sport"."leagues" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "sport"."seasons" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "sport"."teams" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "challenge"."week_challenge_lineups" ALTER COLUMN "pick_status" TYPE "sport"."Status_new" USING ("pick_status"::text::"sport"."Status_new");
ALTER TABLE "challenge"."categories" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "challenge"."groups" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TABLE "challenge"."subgroups" ALTER COLUMN "status" TYPE "sport"."Status_new" USING ("status"::text::"sport"."Status_new");
ALTER TYPE "sport"."Status" RENAME TO "Status_old";
ALTER TYPE "sport"."Status_new" RENAME TO "Status";
DROP TYPE "sport"."Status_old";
ALTER TABLE "challenge"."subgroups" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "sport"."leagues" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "challenge"."categories" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "user"."users" ALTER COLUMN "account_status" SET DEFAULT 'Active';
ALTER TABLE "sport"."teams" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "challenge"."groups" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "sport"."sports" ALTER COLUMN "status" SET DEFAULT 'Inactive';
ALTER TABLE "sport"."seasons" ALTER COLUMN "status" SET DEFAULT 'Inactive';
COMMIT;

-- AlterTable
ALTER TABLE "challenge"."categories" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "challenge"."challenge_participations" DROP COLUMN "status",
ADD COLUMN     "status" "challenge"."ChallengeParticipationStatus";

-- AlterTable
ALTER TABLE "challenge"."challenge_results" DROP COLUMN "participant_outcome",
ADD COLUMN     "participant_outcome" "challenge"."Outcome",
DROP COLUMN "final_outcome",
ADD COLUMN     "final_outcome" "challenge"."Outcome";

-- AlterTable
ALTER TABLE "challenge"."challenges" DROP COLUMN "challenge_mode",
ADD COLUMN     "challenge_mode" "challenge"."ChallengeMode" NOT NULL,
DROP COLUMN "challenge_type",
ADD COLUMN     "challenge_type" "challenge"."ChallengeType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "challenge"."ChallengeStatus",
DROP COLUMN "final_outcome",
ADD COLUMN     "final_outcome" "challenge"."Outcome";

-- AlterTable
ALTER TABLE "challenge"."contract_data_feed" DROP COLUMN "participant_outcome",
ADD COLUMN     "participant_outcome" "challenge"."Outcome",
DROP COLUMN "final_outcome",
ADD COLUMN     "final_outcome" "challenge"."Outcome",
DROP COLUMN "event_id",
ADD COLUMN     "event_id" "challenge"."CdfEvent",
DROP COLUMN "status",
ADD COLUMN     "status" "challenge"."CdfTxnStatus";

-- AlterTable
ALTER TABLE "challenge"."groups" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "challenge"."subgroups" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "challenge"."week_challenge_lineups" DROP COLUMN "pick_status",
ADD COLUMN     "pick_status" "sport"."Status" NOT NULL;

-- AlterTable
ALTER TABLE "sport"."leagues" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "sport"."seasons" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "sport"."sports" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "sport"."teams" ALTER COLUMN "status" SET DEFAULT 'Inactive';

-- AlterTable
ALTER TABLE "user"."users" ALTER COLUMN "account_status" SET DEFAULT 'Active';
