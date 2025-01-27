-- CreateTable
CREATE TABLE "sport"."scheduled_games" (
    "scheduled_games_id" SERIAL NOT NULL,
    "api_source_id" INTEGER NOT NULL,
    "data" JSONB,
    "sync_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_games_pkey" PRIMARY KEY ("scheduled_games_id")
);

-- CreateTable
CREATE TABLE "sport"."team_in_league" (
    "team_id" INTEGER NOT NULL,
    "league_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_in_league_pkey" PRIMARY KEY ("team_id","league_id")
);

-- AddForeignKey
ALTER TABLE "sport"."scheduled_games" ADD CONSTRAINT "scheduled_games_api_source_id_fkey" FOREIGN KEY ("api_source_id") REFERENCES "sport"."api_sources"("api_source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."team_in_league" ADD CONSTRAINT "team_in_league_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "sport"."teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport"."team_in_league" ADD CONSTRAINT "team_in_league_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "sport"."leagues"("league_id") ON DELETE RESTRICT ON UPDATE CASCADE;
