CREATE MATERIALIZED VIEW sport.sports_stage_status_data TABLESPACE pg_default AS
SELECT nba.api_game_id,
    nba.game_id,
    nba.stage,
    nba.day_of_stage,
    nba.week_of_stage,
    nba.api_status,
    nba.status,
    nba.start_date,
    nba.stage_start_date,
    nba."timestamp",
    nba.home,
    nba.away,
    nba.sport_id,
    nba.valid_day,
    nba.valid_week,
    'NBA'::text AS sport
FROM sport.nba_games_stage_status_view nba
UNION ALL
SELECT mlb.api_game_id,
    mlb.game_id,
    mlb.stage,
    mlb.day_of_stage,
    mlb.week_of_stage,
    mlb.api_status,
    mlb.status,
    mlb.start_date,
    mlb.stage_start_date,
    mlb."timestamp",
    mlb.home,
    mlb.away,
    mlb.sport_id,
    mlb.valid_day,
    mlb.valid_week,
    'MLB'::text AS sport
FROM sport.mlb_games_stage_status_view mlb WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX sports_stage_status_index ON sport.sports_stage_status_data USING btree (
    api_game_id,
    game_id,
    stage,
    day_of_stage,
    week_of_stage,
    STATUS,
    start_date,
    stage_start_date,
    "timestamp",
    home,
    away,
    sport_id,
    valid_day,
    valid_week,
    sport
);
