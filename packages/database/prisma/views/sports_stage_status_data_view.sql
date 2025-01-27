CREATE MATERIALIZED VIEW sport.sports_stage_status_data TABLESPACE pg_default AS
SELECT
    basketball.api_game_id
    , basketball.game_id
    , basketball.stage
    , basketball.day_of_stage
    , basketball.week_of_stage
    , basketball.api_status
    , basketball.status
    , basketball.start_date
    , basketball.stage_start_date
    , basketball."timestamp"
    , basketball.home
    , basketball.away
    , basketball.sport_id
    , basketball.league_id
    , basketball.sport
    , basketball.valid_day
    , basketball.valid_week
FROM sport.basketball_games_stage_status_view AS basketball
UNION ALL
SELECT
    baseball.api_game_id
    , baseball.game_id
    , baseball.stage
    , baseball.day_of_stage
    , baseball.week_of_stage
    , baseball.api_status
    , baseball.status
    , baseball.start_date
    , baseball.stage_start_date
    , baseball."timestamp"
    , baseball.home
    , baseball.away
    , baseball.sport_id
    , baseball.league_id
    , baseball.sport
    , baseball.valid_day
    , baseball.valid_week
FROM sport.baseball_games_stage_status_view AS baseball
UNION ALL
SELECT
    mma.api_game_id
    , mma.game_id
    , mma.stage
    , mma.day_of_stage
    , mma.week_of_stage
    , mma.api_status
    , mma.status
    , mma.start_date
    , mma.stage_start_date
    , mma."timestamp"
    , mma.home
    , mma.away
    , mma.sport_id
    , mma.league_id
    , mma.sport
    , mma.valid_day
    , mma.valid_week
FROM sport.mma_games_stage_status_view AS mma
UNION ALL
SELECT
    soc.api_game_id
    , soc.game_id
    , soc.stage
    , soc.day_of_stage
    , soc.week_of_stage
    , soc.api_status
    , soc.status
    , soc.start_date
    , soc.stage_start_date
    , soc."timestamp"
    , soc.home
    , soc.away
    , soc.sport_id
    , soc.league_id
    , soc.sport
    , soc.valid_day
    , soc.valid_week
FROM sport.soccer_games_stage_status_view AS soc
UNION ALL
SELECT
    football.api_game_id
    , football.game_id
    , football.stage
    , football.day_of_stage
    , football.week_of_stage
    , football.api_status
    , football.status
    , football.start_date
    , football.stage_start_date
    , football."timestamp"
    , football.home
    , football.away
    , football.sport_id
    , football.league_id
    , football.sport
    , football.valid_day
    , football.valid_week
FROM sport.football_games_stage_status_view AS football WITH DATA;

-- View indexes:
CREATE UNIQUE INDEX sports_stage_status_index ON sport.sports_stage_status_data USING btree (
    api_game_id
    , game_id
    , stage
    , day_of_stage
    , week_of_stage
    , status
    , start_date
    , stage_start_date
    , "timestamp"
    , home
    , away
    , sport_id
    , league_id
    , valid_day
    , valid_week
    , sport
);
