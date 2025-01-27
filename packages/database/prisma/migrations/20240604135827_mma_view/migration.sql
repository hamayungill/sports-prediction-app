-- This is an empty migration.
CREATE OR REPLACE VIEW sport.mma_games_stage_status_view AS WITH mma_games_data AS (
        SELECT g.game_id,
            g.season_id,
            g.api_game_id,
            g.data,
            g.created_at,
            g.updated_at,
            g.api_source_id,
            g.processing_status,
            g.start_date
        FROM sport.games g
        WHERE (
                g.api_source_id IN (
                    SELECT as2.api_source_id
                    FROM sport.api_sources as2
                    WHERE lower(as2.api_source_name) ~~* '%mma%'::text
                )
            )
    ),
    game_stages AS (
        SELECT mma_games_data.data->>'id'::text AS api_game_id,
            (
                (
                    (mma_games_data.data->>'date'::text)::timestamp WITH time zone
                ) AT TIME ZONE 'UTC'::text
            ) AS start_date,
            mma_games_data.data->>'stage'::text AS stage
        FROM mma_games_data
    ),
    stage_start_dates AS (
        SELECT mma_games_data.data->>'stage'::text AS stage,
            (
                min(mma_games_data.data->>'date'::text)::timestamp WITH time zone AT TIME ZONE 'UTC'::text
            ) AS stage_start_date
        FROM mma_games_data
        GROUP BY (mma_games_data.data->>'stage'::text)
    ),
    days_weeks_info AS (
        SELECT gs.api_game_id,
            g.game_id,
            gs.stage,
            gs.start_date,
            ssd.stage_start_date,
            gs.start_date::date - ssd.stage_start_date::date + 1 AS day_of_stage,
            (gs.start_date::date - ssd.stage_start_date::date) / 7 + 1 AS week_of_stage
        FROM game_stages gs
            JOIN stage_start_dates ssd ON gs.stage = ssd.stage
            JOIN sport.games g ON gs.api_game_id = g.api_game_id
    ),
    days_weeks_status AS (
        SELECT g.api_game_id,
            dwi.game_id,
            dwi.stage,
            dwi.day_of_stage,
            dwi.week_of_stage,
            g.data->>'status'::text AS api_status,
            CASE
                WHEN lower(g.data->>'status'::text) = 'cancelled'::text
                AND dwi.start_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'::text) THEN 'scheduled'::text
                ELSE lower(g.data->>'status'::text)
            END AS STATUS,
            dwi.start_date,
            dwi.stage_start_date,
            (g.data->>'timestamp'::text)::integer AS "timestamp",
            (g.data->'teams'::text)->'home'::text AS home,
            (g.data->'teams'::text)->'away'::text AS away,
            s2.sport_id,
            (
                (s2.feature_flags->'pickem'::text)->>'day'::text
            )::boolean AS pickem_day,
            (
                (s2.feature_flags->'pickem'::text)->>'week'::text
            )::boolean AS pickem_week
        FROM sport.games g
            JOIN days_weeks_info dwi ON g.game_id = dwi.game_id
            JOIN sport.seasons s ON g.season_id = s.season_id
            JOIN sport.leagues l ON s.league_id = l.league_id
            JOIN sport.sports s2 ON s2.sport_id = l.sport_id
    )
SELECT days_weeks_status.api_game_id,
    days_weeks_status.game_id,
    days_weeks_status.stage,
    days_weeks_status.day_of_stage,
    days_weeks_status.week_of_stage,
    days_weeks_status.api_status,
    days_weeks_status.status,
    days_weeks_status.start_date,
    days_weeks_status.stage_start_date,
    days_weeks_status."timestamp",
    days_weeks_status.home,
    days_weeks_status.away,
    days_weeks_status.sport_id,
    CASE
        WHEN days_weeks_status.pickem_day = false THEN false
        ELSE min(
            CASE
                WHEN lower(days_weeks_status.status) <> 'scheduled'::text THEN days_weeks_status.start_date
                ELSE NULL::timestamp without time zone
            END
        ) OVER (
            PARTITION BY days_weeks_status.stage,
            days_weeks_status.day_of_stage
            ORDER BY days_weeks_status.start_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_day,
    CASE
        WHEN days_weeks_status.pickem_week = false THEN false
        ELSE min(
            CASE
                WHEN lower(days_weeks_status.status) <> 'scheduled'::text THEN days_weeks_status.start_date
                ELSE NULL::timestamp without time zone
            END
        ) OVER (
            PARTITION BY days_weeks_status.stage,
            days_weeks_status.week_of_stage
            ORDER BY days_weeks_status.start_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_week
FROM days_weeks_status
ORDER BY days_weeks_status.start_date;
