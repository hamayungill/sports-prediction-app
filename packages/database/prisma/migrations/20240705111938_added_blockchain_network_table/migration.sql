/*
  Warnings:

  - You are about to drop the column `chain` on the `challenge_participations` table. All the data in the column will be lost.
  - You are about to drop the column `layer` on the `challenge_participations` table. All the data in the column will be lost.
  - You are about to drop the column `chain` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `layer` on the `contracts` table. All the data in the column will be lost.
  - Added the required column `network_id` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."challenge_participations" DROP COLUMN "chain",
DROP COLUMN "layer",
ADD COLUMN     "network_id" INTEGER;

-- AlterTable
ALTER TABLE "challenge"."contracts" DROP COLUMN "chain",
DROP COLUMN "layer",
ADD COLUMN     "network_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "challenge"."Layer";

-- CreateTable
CREATE TABLE "challenge"."blockchain_networks" (
    "network_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_networks_pkey" PRIMARY KEY ("network_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_networks_name_key" ON "challenge"."blockchain_networks"("name");

-- AddForeignKey
ALTER TABLE "challenge"."contracts" ADD CONSTRAINT "contracts_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "challenge"."blockchain_networks"("network_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenge_participations" ADD CONSTRAINT "challenge_participations_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "challenge"."blockchain_networks"("network_id") ON DELETE SET NULL ON UPDATE CASCADE;
