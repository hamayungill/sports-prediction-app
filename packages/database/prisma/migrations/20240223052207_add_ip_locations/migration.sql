-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "challenge";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "internal";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sport";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user";

-- CreateTable
CREATE TABLE "user"."ip_locations" (
    "location_id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ip_locations_location_id_key" ON "user"."ip_locations"("location_id");

-- CreateIndex
CREATE INDEX "ip_locations_ip_idx" ON "user"."ip_locations"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "ip_locations_ip_country_state_city_key" ON "user"."ip_locations"("ip", "country", "state", "city");
