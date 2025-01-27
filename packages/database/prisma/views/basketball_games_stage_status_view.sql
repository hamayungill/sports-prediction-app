CREATE VIEW sport.basketball_games_stage_status_view AS WITH basketball_games_data AS (
    SELECT
        g.game_id
        , g.season_id
        , g.api_game_id
        , g.data
        , g.created_at
        , g.updated_at
        , g.api_source_id
        , g.processing_status
        , g.start_date::timestamp AT TIME ZONE 'UTC' AS start_date
        , l.league_id
        , s2.sport_id
        , s2.sport_name
        , s2.feature_flags
        , s2.feature_flags ->> 'time_zone'::text AS time_zone
    FROM sport.games AS g
    INNER JOIN sport.seasons AS s ON g.season_id = s.season_id
    INNER JOIN sport.leagues AS l ON s.league_id = l.league_id
    INNER JOIN sport.sports AS s2 ON l.sport_id = s2.sport_id
    WHERE
        lower(s2.sport_name) = 'basketball'::text
        AND (
            ((g.data -> 'teams'::text) -> 'home'::text) ->> 'name'::text
        ) IS NOT NULL
        AND lower(
            ((g.data -> 'teams'::text) -> 'home'::text) ->> 'name'::text
        ) <> 'tba'::text
        AND (
            ((g.data -> 'teams'::text) -> 'away'::text) ->> 'name'::text
        ) IS NOT NULL
        AND lower(
            ((g.data -> 'teams'::text) -> 'away'::text) ->> 'name'::text
        ) <> 'tba'::text
)

, game_stages AS (
    SELECT
        basketball_games_data.time_zone
        , basketball_games_data.start_date AS start_date_utc
        , basketball_games_data.data ->> 'id'::text AS api_game_id
        , basketball_games_data.start_date AT TIME ZONE basketball_games_data.time_zone AS start_date_local
        , basketball_games_data.data ->> 'stage'::text AS stage
    FROM basketball_games_data
)

, stage_start_dates AS (
    SELECT
        basketball_games_data.data ->> 'stage'::text AS stage
        , min(basketball_games_data.start_date) AS stage_start_date_utc
        , min(
            basketball_games_data.start_date AT TIME ZONE basketball_games_data.time_zone
        ) AS stage_start_date_local
    FROM basketball_games_data
    GROUP BY
        (basketball_games_data.data ->> 'stage'::text)
        , basketball_games_data.time_zone
)

, days_weeks_info AS (
    SELECT
        gs.api_game_id
        , g.game_id
        , gs.stage
        , gs.start_date_utc
        , gs.start_date_local
        , ssd.stage_start_date_utc
        , ssd.stage_start_date_local
        , gs.start_date_local::date
        - ssd.stage_start_date_local::date
        + 1 AS day_of_stage
        , (
            gs.start_date_local::date - ssd.stage_start_date_local::date
        ) / 7 + 1 AS week_of_stage
    FROM game_stages AS gs
    INNER JOIN stage_start_dates AS ssd ON gs.stage = ssd.stage
    INNER JOIN sport.games AS g ON gs.api_game_id = g.api_game_id
)

, days_weeks_status AS (
    SELECT
        gd.api_game_id
        , dwi.game_id
        , dwi.stage
        , dwi.day_of_stage
        , dwi.week_of_stage
        , dwi.start_date_utc AS start_date
        , dwi.stage_start_date_utc AS stage_start_date
        , (gd.data ->> 'timestamp'::text)::integer AS "timestamp"
        , gd.sport_id
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'day'::text
        )::boolean AS pickem_day
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'week'::text
        )::boolean AS pickem_week
        , gd.league_id
        , gd.sport_name
        , gd.data ->> 'status'::text AS api_status
        , lower(gd.data ->> 'status'::text) AS status
        , (gd.data -> 'teams'::text) -> 'home'::text AS home
        , (gd.data -> 'teams'::text) -> 'away'::text AS away
    FROM basketball_games_data AS gd
    INNER JOIN days_weeks_info AS dwi ON gd.game_id = dwi.game_id
)

SELECT
    days_weeks_status.api_game_id
    , days_weeks_status.game_id
    , days_weeks_status.stage
    , days_weeks_status.day_of_stage
    , days_weeks_status.week_of_stage
    , days_weeks_status.api_status
    , days_weeks_status.status
    , days_weeks_status.start_date
    , days_weeks_status.stage_start_date
    , days_weeks_status."timestamp"
    , days_weeks_status.home
    , days_weeks_status.away
    , days_weeks_status.sport_id
    , days_weeks_status.sport_name AS sport
    , days_weeks_status.league_id
    , CASE
        WHEN days_weeks_status.pickem_day = FALSE THEN FALSE
        ELSE min(
            CASE
                WHEN
                    lower(days_weeks_status.status) <> 'scheduled'::text
                    THEN days_weeks_status.start_date
                ELSE NULL::timestamp without time zone
            END
        ) OVER (
            PARTITION BY
                days_weeks_status.stage
                , days_weeks_status.day_of_stage
            ORDER BY
                days_weeks_status.start_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_day
    , CASE
        WHEN days_weeks_status.pickem_week = FALSE THEN FALSE
        ELSE min(
            CASE
                WHEN
                    lower(days_weeks_status.status) <> 'scheduled'::text
                    THEN days_weeks_status.start_date
                ELSE NULL::timestamp without time zone
            END
        ) OVER (
            PARTITION BY
                days_weeks_status.stage
                , days_weeks_status.week_of_stage
            ORDER BY
                days_weeks_status.start_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_week
FROM days_weeks_status
ORDER BY
    days_weeks_status.stage
    , days_weeks_status.start_date;
