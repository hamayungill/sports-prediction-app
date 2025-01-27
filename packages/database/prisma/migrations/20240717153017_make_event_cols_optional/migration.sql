-- AlterTable
ALTER TABLE "user"."events"
ALTER COLUMN "user_agent" DROP NOT NULL,
    ALTER COLUMN "browser" DROP NOT NULL,
    ALTER COLUMN "device" DROP NOT NULL,
    ALTER COLUMN "os" DROP NOT NULL;