-- CreateTable
CREATE TABLE "challenge"."sport_in_category" (
    "category_id" INTEGER NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_in_category_pkey" PRIMARY KEY ("category_id","sport_id")
);

-- CreateIndex
CREATE INDEX "categories_api_category_id_idx" ON "challenge"."categories"("api_category_id");

-- CreateIndex
CREATE INDEX "challenges_invite_code_idx" ON "challenge"."challenges"("invite_code");

-- CreateIndex
CREATE INDEX "week_challenge_lineups_challenge_result_id_game_id_idx" ON "challenge"."week_challenge_lineups"("challenge_result_id", "game_id");

-- AddForeignKey
ALTER TABLE "challenge"."sport_in_category" ADD CONSTRAINT "sport_in_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "challenge"."categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge"."sport_in_category" ADD CONSTRAINT "sport_in_category_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;
