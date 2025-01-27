CREATE OR REPLACE VIEW sport.football_games_stage_status_view AS WITH football_games_data AS (
        SELECT g.game_id,
            g.season_id,
            g.api_game_id,
            g.data,
            g.created_at,
            g.updated_at,
            g.api_source_id,
            g.processing_status,
            g.start_date,
            l.league_id,
            s2.sport_id,
            s2.sport_name,
            s2.feature_flags,
            s2.feature_flags->>'time_zone'::TEXT AS time_zone
        FROM sport.games g
            JOIN sport.seasons s ON g.season_id = s.season_id
            JOIN sport.leagues l ON s.league_id = l.league_id
            JOIN sport.sports s2 ON l.sport_id = s2.sport_id
        WHERE lower(s2.sport_name) = 'football'
    ),
    game_stages AS (
        SELECT football_games_data.data->>'id'::text AS api_game_id,
            (
                (
                    (football_games_data.data->>'date'::text)::timestamp WITH time zone
                ) AT TIME ZONE 'UTC'::text
            ) AS start_date_utc,
            (
                (
                    (
                        (football_games_data.data->>'date'::text)::timestamp WITH time zone
                    ) AT TIME ZONE 'UTC'::text
                ) AT TIME ZONE football_games_data.time_zone
            ) AS start_date_local,
            football_games_data.data->>'stage'::text AS stage
        FROM football_games_data
    ),
    stage_start_dates AS (
        SELECT football_games_data.data->>'stage'::text AS stage,
            (
                min(football_games_data.data->>'date'::text)::timestamp WITH time zone AT TIME ZONE 'UTC'::text
            ) AS stage_start_date_utc,
            (
                (
                    min(football_games_data.data->>'date'::text)::timestamp WITH time zone AT TIME ZONE 'UTC'::text
                ) AT TIME ZONE football_games_data.time_zone
            ) AS stage_start_date_local
        FROM football_games_data
        GROUP BY (football_games_data.data->>'stage'::text),
            football_games_data.time_zone
    ),
    days_weeks_info AS (
        SELECT gs.api_game_id,
            g.game_id,
            gs.stage,
            gs.start_date_utc,
            gs.start_date_local,
            ssd.stage_start_date_utc,
            ssd.stage_start_date_local,
            gs.start_date_utc::date - ssd.stage_start_date_utc::date + 1 AS day_of_stage,
            (
                gs.start_date_local::date - ssd.stage_start_date_local::date
            ) / 7 + 1 AS week_of_stage
        FROM game_stages gs
            JOIN stage_start_dates ssd ON gs.stage = ssd.stage
            JOIN sport.games g ON gs.api_game_id = g.api_game_id
    ),
    days_weeks_status AS (
        SELECT gd.api_game_id,
            dwi.game_id,
            dwi.stage,
            dwi.day_of_stage,
            dwi.week_of_stage,
            gd.data->>'status' AS api_status,
            lower(gd.data->>'status') AS STATUS,
            dwi.start_date_local AS start_date,
            dwi.stage_start_date_local AS stage_start_date,
            (gd.data->>'timestamp')::integer AS "timestamp",
            (gd.data->'teams')->'home' AS home,
            (gd.data->'teams')->'away' AS away,
            gd.sport_id,
            gd.sport_name,
            ((gd.feature_flags->'pickem')->>'day')::boolean AS pickem_day,
            ((gd.feature_flags->'pickem')->>'week')::boolean AS pickem_week,
            gd.league_id
        FROM football_games_data gd
            JOIN days_weeks_info dwi ON gd.game_id = dwi.game_id
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
    days_weeks_status.sport_name AS sport,
    days_weeks_status.league_id,
    CASE
        WHEN days_weeks_status.pickem_day = FALSE THEN FALSE
        ELSE min(
            CASE
                WHEN lower(days_weeks_status.status) <> 'scheduled' THEN days_weeks_status.start_date
                ELSE NULL::timestamp WITHOUT time ZONE
            END
        ) OVER (
            PARTITION BY days_weeks_status.stage,
            days_weeks_status.day_of_stage
            ORDER BY days_weeks_status.start_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_day,
    CASE
        WHEN days_weeks_status.pickem_week = FALSE THEN FALSE
        ELSE min(
            CASE
                WHEN lower(days_weeks_status.status) <> 'scheduled' THEN days_weeks_status.start_date
                ELSE NULL::timestamp WITHOUT time ZONE
            END
        ) OVER (
            PARTITION BY days_weeks_status.stage,
            days_weeks_status.week_of_stage
            ORDER BY days_weeks_status.start_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
    END AS valid_week
FROM days_weeks_status
ORDER BY days_weeks_status.stage,
    days_weeks_status.start_date;