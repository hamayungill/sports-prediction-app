/*
  Warnings:

  - Added the required column `sport_id` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenge"."challenges" ADD COLUMN     "sport_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "user"."favourites" (
    "user_id" TEXT NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "is_favourite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favourites_pkey" PRIMARY KEY ("user_id","challenge_id")
);

-- CreateIndex
CREATE INDEX "favourites_user_id_challenge_id_idx" ON "user"."favourites"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "user"."favourites" ADD CONSTRAINT "favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."favourites" ADD CONSTRAINT "favourites_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."challenges" ADD CONSTRAINT "challenges_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
