-- CreateEnum
CREATE TYPE "user"."BlockLevel" AS ENUM ('Country', 'State', 'City');

-- CreateTable
CREATE TABLE "user"."blacklist_locations" (
    "blacklist_location_id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "block_level" "user"."BlockLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklist_locations_pkey" PRIMARY KEY ("blacklist_location_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_locations_blacklist_location_id_key" ON "user"."blacklist_locations"("blacklist_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_locations_country_state_city_key" ON "user"."blacklist_locations"("country", "state", "city");
