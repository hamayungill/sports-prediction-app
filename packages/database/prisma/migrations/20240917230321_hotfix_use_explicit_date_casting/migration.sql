DROP MATERIALIZED VIEW IF EXISTS sport.sports_stage_status_data;

DROP VIEW IF EXISTS sport.soccer_games_stage_status_view;

DROP VIEW IF EXISTS sport.baseball_games_stage_status_view;

DROP VIEW IF EXISTS sport.football_games_stage_status_view;

DROP VIEW IF EXISTS sport.basketball_games_stage_status_view;

DROP VIEW IF EXISTS sport.mma_games_stage_status_view;

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

CREATE VIEW sport.baseball_games_stage_status_view AS WITH baseball_games_data AS (
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
        lower(s2.sport_name) = 'baseball'::text
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
        baseball_games_data.time_zone
        , baseball_games_data.start_date AS start_date_utc
        , baseball_games_data.data ->> 'id'::text AS api_game_id
        , baseball_games_data.start_date AT TIME ZONE baseball_games_data.time_zone AS start_date_local
        , baseball_games_data.data ->> 'stage'::text AS stage
    FROM baseball_games_data
)

, stage_start_dates AS (
    SELECT
        baseball_games_data.data ->> 'stage'::text AS stage
        , min(baseball_games_data.start_date) AS stage_start_date_utc
        , min(
            baseball_games_data.start_date AT TIME ZONE baseball_games_data.time_zone
        ) AS stage_start_date_local
    FROM baseball_games_data
    GROUP BY
        (baseball_games_data.data ->> 'stage'::text)
        , baseball_games_data.time_zone
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
        , CASE
            WHEN
                lower(gd.data ->> 'status'::text) = 'cancelled'::text
                AND dwi.start_date_local
                >= (current_timestamp AT TIME ZONE 'UTC'::text)
                THEN 'scheduled'::text
            ELSE lower(gd.data ->> 'status'::text)
        END AS status
        , (gd.data -> 'teams'::text) -> 'home'::text AS home
        , (gd.data -> 'teams'::text) -> 'away'::text AS away
    FROM baseball_games_data AS gd
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

CREATE VIEW sport.football_games_stage_status_view AS WITH football_games_data AS (
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
        lower(s2.sport_name) = 'football'::text
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
        football_games_data.time_zone
        , football_games_data.start_date AS start_date_utc
        , football_games_data.data ->> 'id'::text AS api_game_id
        , football_games_data.start_date AT TIME ZONE football_games_data.time_zone AS start_date_local
        , football_games_data.data ->> 'stage'::text AS stage
    FROM football_games_data
)

, stage_start_dates AS (
    SELECT
        football_games_data.data ->> 'stage'::text AS stage
        , min(football_games_data.start_date) AS stage_start_date_utc
        , min(
            football_games_data.start_date AT TIME ZONE football_games_data.time_zone
        ) AS stage_start_date_local
    FROM football_games_data
    GROUP BY
        (football_games_data.data ->> 'stage'::text)
        , football_games_data.time_zone
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
        , gd.sport_name
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'day'::text
        )::boolean AS pickem_day
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'week'::text
        )::boolean AS pickem_week
        , gd.league_id
        , gd.data ->> 'status'::text AS api_status
        , lower(gd.data ->> 'status'::text) AS status
        , (gd.data -> 'teams'::text) -> 'home'::text AS home
        , (gd.data -> 'teams'::text) -> 'away'::text AS away
    FROM football_games_data AS gd
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
                    THEN days_weeks_status.start_date::timestamp with time zone
                ELSE NULL::timestamp without time zone::timestamp with time zone
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
                    THEN days_weeks_status.start_date::timestamp with time zone
                ELSE NULL::timestamp without time zone::timestamp with time zone
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

CREATE VIEW sport.mma_games_stage_status_view AS WITH mma_games_data AS (
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
        lower(s2.sport_name) = 'mma'::text
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
        mma_games_data.time_zone
        , mma_games_data.start_date AS start_date_utc
        , mma_games_data.data ->> 'id'::text AS api_game_id
        , mma_games_data.start_date AT TIME ZONE mma_games_data.time_zone AS start_date_local
        , mma_games_data.data ->> 'stage'::text AS stage
    FROM mma_games_data
)

, stage_start_dates AS (
    SELECT
        mma_games_data.data ->> 'stage'::text AS stage
        , min(mma_games_data.start_date) AS stage_start_date_utc
        , min(
            mma_games_data.start_date AT TIME ZONE mma_games_data.time_zone
        ) AS stage_start_date_local
    FROM mma_games_data
    GROUP BY
        (mma_games_data.data ->> 'stage'::text)
        , mma_games_data.time_zone
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
        , gd.sport_name
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'day'::text
        )::boolean AS pickem_day
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'week'::text
        )::boolean AS pickem_week
        , gd.league_id
        , gd.data ->> 'status'::text AS api_status
        , CASE
            WHEN
                lower(gd.data ->> 'status'::text) = 'cancelled'::text
                AND dwi.start_date_utc
                >= (current_timestamp AT TIME ZONE 'UTC'::text)
                THEN 'scheduled'::text
            ELSE lower(gd.data ->> 'status'::text)
        END AS status
        , (gd.data -> 'teams'::text) -> 'home'::text AS home
        , (gd.data -> 'teams'::text) -> 'away'::text AS away
    FROM mma_games_data AS gd
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

CREATE VIEW sport.soccer_games_stage_status_view AS WITH soccer_games_data AS (
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
        lower(s2.sport_name) = 'soccer'::text
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
        soccer_games_data.time_zone
        , soccer_games_data.start_date AS start_date_utc
        , soccer_games_data.data ->> 'id'::text AS api_game_id
        , soccer_games_data.start_date AT TIME ZONE soccer_games_data.time_zone AS start_date_local
        , CASE
            WHEN
                trim(
                    BOTH ' '::text
                    FROM split_part(
                        soccer_games_data.data ->> 'stage'::text
                        , '-'::text
                        , 2
                    )
                ) ~ '^\d+$'::text
                THEN split_part(
                    soccer_games_data.data ->> 'stage'::text
                    , '-'::text
                    , 1
                )
            ELSE soccer_games_data.data ->> 'stage'::text
        END AS stage
    FROM soccer_games_data
)

, stage_start_dates AS (
    SELECT
        CASE
            WHEN
                trim(
                    BOTH ' '::text
                    FROM split_part(
                        soccer_games_data.data ->> 'stage'::text
                        , '-'::text
                        , 2
                    )
                ) ~ '^\d+$'::text
                THEN split_part(
                    soccer_games_data.data ->> 'stage'::text
                    , '-'::text
                    , 1
                )
            ELSE soccer_games_data.data ->> 'stage'::text
        END AS stage
        , min(soccer_games_data.start_date) AS stage_start_date_utc
        , min(
            soccer_games_data.start_date AT TIME ZONE soccer_games_data.time_zone
        ) AS stage_start_date_local
    FROM soccer_games_data
    GROUP BY (
        CASE
            WHEN
                trim(
                    BOTH ' '::text
                    FROM split_part(
                        soccer_games_data.data ->> 'stage'::text
                        , '-'::text
                        , 2
                    )
                ) ~ '^\d+$'::text
                THEN split_part(
                    soccer_games_data.data ->> 'stage'::text
                    , '-'::text
                    , 1
                )
            ELSE soccer_games_data.data ->> 'stage'::text
        END
    )
    , soccer_games_data.time_zone
)

, days_weeks_info AS (
    SELECT
        gs.api_game_id
        , g.game_id
        , gs.stage
        , gs.time_zone
        , gs.start_date_utc
        , gs.start_date_local
        , ssd.stage_start_date_utc
        , ssd.stage_start_date_local
        , gs.start_date_local::date
        - ssd.stage_start_date_local::date
        + 1 AS day_of_stage
        , CASE
            WHEN
                trim(
                    BOTH ' '::text
                    FROM split_part(gs.stage, '-'::text, 2)
                ) ~ '^\d+$'::text
                THEN nullif(
                    trim(
                        BOTH ' '::text
                        FROM split_part(gs.stage, '-'::text, 2)
                    )
                    , ''::text
                )::integer
            ELSE (
                gs.start_date_local::date - ssd.stage_start_date_local::date
            ) / 7 + 1
        END AS week_of_stage
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
        , dwi.time_zone
        , dwi.start_date_utc AS start_date
        , dwi.stage_start_date_utc AS stage_start_date
        , (gd.data ->> 'timestamp'::text)::integer AS "timestamp"
        , gd.sport_id
        , gd.sport_name
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'day'::text
        )::boolean AS pickem_day
        , (
            (gd.feature_flags -> 'pickem'::text) ->> 'week'::text
        )::boolean AS pickem_week
        , gd.league_id
        , gd.data ->> 'status'::text AS api_status
        , lower(gd.data ->> 'status'::text) AS status
        , (gd.data -> 'teams'::text) -> 'home'::text AS home
        , (gd.data -> 'teams'::text) -> 'away'::text AS away
    FROM soccer_games_data AS gd
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
                    THEN days_weeks_status.start_date::timestamp with time zone
                ELSE NULL::timestamp without time zone::timestamp with time zone
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
                    THEN days_weeks_status.start_date::timestamp with time zone
                ELSE NULL::timestamp without time zone::timestamp with time zone
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
