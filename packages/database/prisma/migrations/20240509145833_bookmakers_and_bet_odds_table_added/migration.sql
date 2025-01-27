-- CreateTable
CREATE TABLE "sport"."bookmakers" (
    "bookmaker_id" SERIAL NOT NULL,
    "sport_id" INTEGER NOT NULL,
    "bookmaker_name" TEXT NOT NULL,
    "bookmaker_api_id" INTEGER NOT NULL,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmakers_pkey" PRIMARY KEY ("bookmaker_id")
);

-- CreateTable
CREATE TABLE "sport"."bet_odds" (
    "sport_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "bookmaker_id" INTEGER NOT NULL,
    "api_category_id" TEXT NOT NULL,
    "odds_type" TEXT NOT NULL,
    "spread_val" TEXT NOT NULL DEFAULT '(0)',
    "threshold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "decimal_odds_value" DECIMAL(65,30) NOT NULL,
    "api_last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "sport"."Status" NOT NULL DEFAULT 'Active',
    "moneyline" DECIMAL(65,30) NOT NULL,
    "fraction" TEXT NOT NULL,
    "indonesian" DECIMAL(65,30) NOT NULL,
    "hongkong" DECIMAL(65,30) NOT NULL,
    "malaysian" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_odds_pkey" PRIMARY KEY ("sport_id","game_id","bookmaker_id","api_category_id","odds_type","spread_val","threshold")
);

-- CreateIndex
CREATE INDEX "bet_odds_sport_id_game_id_bookmaker_id_api_category_id_odds_idx" ON "sport"."bet_odds"("sport_id", "game_id", "bookmaker_id", "api_category_id", "odds_type", "spread_val", "threshold");

-- AddForeignKey
ALTER TABLE "sport"."bookmakers" ADD CONSTRAINT "bookmakers_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."bet_odds" ADD CONSTRAINT "bet_odds_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sport"."sports"("sport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."bet_odds" ADD CONSTRAINT "bet_odds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "sport"."games"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."bet_odds" ADD CONSTRAINT "bet_odds_bookmaker_id_fkey" FOREIGN KEY ("bookmaker_id") REFERENCES "sport"."bookmakers"("bookmaker_id") ON DELETE RESTRICT ON UPDATE CASCADE;
