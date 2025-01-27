/*
  Warnings:

  - You are about to drop the `favourites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user"."favourites" DROP CONSTRAINT "favourites_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "user"."favourites" DROP CONSTRAINT "favourites_user_id_fkey";

-- DropTable
DROP TABLE "user"."favourites";

-- CreateTable
CREATE TABLE "user"."favorites" (
    "user_id" TEXT NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "is_favourite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","challenge_id")
);

-- CreateIndex
CREATE INDEX "favorites_user_id_challenge_id_idx" ON "user"."favorites"("user_id", "challenge_id");

-- AddForeignKey
ALTER TABLE "user"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."favorites" ADD CONSTRAINT "favorites_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"."challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;
