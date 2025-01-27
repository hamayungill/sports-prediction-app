/*
  Warnings:

  - The `status` column on the `leagues` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `seasons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `sports` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `teams` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "sport"."Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "sport"."leagues" DROP COLUMN "status",
ADD COLUMN     "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "sport"."seasons" DROP COLUMN "status",
ADD COLUMN     "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "sport"."sports" ALTER COLUMN "sport_name" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "sport"."teams" DROP COLUMN "status",
ADD COLUMN     "status" "sport"."Status" NOT NULL DEFAULT 'INACTIVE';

-- DropEnum
DROP TYPE "sport"."LeagueStatus";

-- DropEnum
DROP TYPE "sport"."SeasonsStatus";

-- DropEnum
DROP TYPE "sport"."SportsStatus";

-- DropEnum
DROP TYPE "sport"."TeamsStatus";
