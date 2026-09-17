CREATE TABLE weather_forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE RESTRICT,
  source_registry_id text NOT NULL,
  capability text NOT NULL,
  provider_grid geometry(Point, 4326) NOT NULL,
  provider_timezone text NOT NULL,
  attribution_text text NOT NULL,
  attribution_url text,
  model_id text NOT NULL,
  model_run_at timestamptz,
  fetched_at timestamptz NOT NULL,
  stale_after timestamptz NOT NULL,
  normalized_checksum char(64) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weather_forecast_runs_source_nonempty CHECK (length(btrim(source_registry_id)) > 0),
  CONSTRAINT weather_forecast_runs_capability CHECK (
    capability IN ('weather.current', 'weather.hourlyForecast', 'weather.dailyForecast')
  ),
  CONSTRAINT weather_forecast_runs_timezone_nonempty CHECK (length(btrim(provider_timezone)) > 0),
  CONSTRAINT weather_forecast_runs_attribution_nonempty CHECK (length(btrim(attribution_text)) > 0),
  CONSTRAINT weather_forecast_runs_model_nonempty CHECK (length(btrim(model_id)) > 0),
  CONSTRAINT weather_forecast_runs_stale_order CHECK (stale_after >= fetched_at),
  CONSTRAINT weather_forecast_runs_checksum_format CHECK (
    normalized_checksum ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT weather_forecast_runs_provider_capability_checksum_unique UNIQUE (
    provider_config_id, capability, normalized_checksum
  )
);

CREATE INDEX weather_forecast_runs_grid_gist_idx
  ON weather_forecast_runs USING GIST (provider_grid);
CREATE INDEX weather_forecast_runs_capability_fetched_idx
  ON weather_forecast_runs (capability, fetched_at DESC);
CREATE INDEX weather_forecast_runs_provider_capability_fetched_idx
  ON weather_forecast_runs (provider_config_id, capability, fetched_at DESC);
CREATE INDEX weather_forecast_runs_stale_after_idx
  ON weather_forecast_runs (stale_after);

CREATE TABLE weather_current_points (
  forecast_run_id uuid PRIMARY KEY REFERENCES weather_forecast_runs(id) ON DELETE CASCADE,
  valid_at timestamptz NOT NULL,
  temperature_c numeric(8, 3) NOT NULL,
  apparent_temperature_c numeric(8, 3),
  relative_humidity_pct numeric(6, 3) NOT NULL,
  pressure_hpa numeric(8, 3) NOT NULL,
  wind_speed_ms numeric(8, 3) NOT NULL,
  wind_gust_ms numeric(8, 3),
  wind_direction_deg numeric(7, 3) NOT NULL,
  cloud_cover_pct numeric(6, 3),
  weather_code integer NOT NULL,
  visibility_m numeric(12, 3),
  uv_index numeric(8, 3),
  precipitation_mm numeric(12, 3),
  rain_mm numeric(12, 3),
  CONSTRAINT weather_current_temperature_range CHECK (temperature_c BETWEEN -100 AND 70),
  CONSTRAINT weather_current_apparent_temperature_range CHECK (
    apparent_temperature_c IS NULL OR apparent_temperature_c BETWEEN -100 AND 70
  ),
  CONSTRAINT weather_current_humidity_range CHECK (relative_humidity_pct BETWEEN 0 AND 100),
  CONSTRAINT weather_current_pressure_range CHECK (pressure_hpa BETWEEN 300 AND 1200),
  CONSTRAINT weather_current_wind_speed_range CHECK (wind_speed_ms BETWEEN 0 AND 200),
  CONSTRAINT weather_current_wind_gust_range CHECK (wind_gust_ms IS NULL OR wind_gust_ms BETWEEN 0 AND 200),
  CONSTRAINT weather_current_wind_direction_range CHECK (wind_direction_deg BETWEEN 0 AND 360),
  CONSTRAINT weather_current_cloud_cover_range CHECK (cloud_cover_pct IS NULL OR cloud_cover_pct BETWEEN 0 AND 100),
  CONSTRAINT weather_current_weather_code_range CHECK (weather_code BETWEEN 0 AND 99),
  CONSTRAINT weather_current_visibility_range CHECK (visibility_m IS NULL OR visibility_m BETWEEN 0 AND 100000),
  CONSTRAINT weather_current_uv_range CHECK (uv_index IS NULL OR uv_index BETWEEN 0 AND 100),
  CONSTRAINT weather_current_precipitation_nonnegative CHECK (precipitation_mm IS NULL OR precipitation_mm >= 0),
  CONSTRAINT weather_current_rain_nonnegative CHECK (rain_mm IS NULL OR rain_mm >= 0)
);
CREATE INDEX weather_current_points_valid_at_idx ON weather_current_points (valid_at DESC);

CREATE TABLE weather_hourly_points (
  forecast_run_id uuid NOT NULL REFERENCES weather_forecast_runs(id) ON DELETE CASCADE,
  valid_at timestamptz NOT NULL,
  temperature_c numeric(8, 3) NOT NULL,
  apparent_temperature_c numeric(8, 3),
  relative_humidity_pct numeric(6, 3) NOT NULL,
  pressure_hpa numeric(8, 3) NOT NULL,
  wind_speed_ms numeric(8, 3) NOT NULL,
  wind_gust_ms numeric(8, 3),
  wind_direction_deg numeric(7, 3) NOT NULL,
  cloud_cover_pct numeric(6, 3),
  weather_code integer NOT NULL,
  visibility_m numeric(12, 3),
  uv_index numeric(8, 3),
  precipitation_mm numeric(12, 3),
  rain_mm numeric(12, 3),
  precipitation_probability_pct numeric(6, 3),
  PRIMARY KEY (forecast_run_id, valid_at),
  CONSTRAINT weather_hourly_temperature_range CHECK (temperature_c BETWEEN -100 AND 70),
  CONSTRAINT weather_hourly_apparent_temperature_range CHECK (
    apparent_temperature_c IS NULL OR apparent_temperature_c BETWEEN -100 AND 70
  ),
  CONSTRAINT weather_hourly_humidity_range CHECK (relative_humidity_pct BETWEEN 0 AND 100),
  CONSTRAINT weather_hourly_pressure_range CHECK (pressure_hpa BETWEEN 300 AND 1200),
  CONSTRAINT weather_hourly_wind_speed_range CHECK (wind_speed_ms BETWEEN 0 AND 200),
  CONSTRAINT weather_hourly_wind_gust_range CHECK (wind_gust_ms IS NULL OR wind_gust_ms BETWEEN 0 AND 200),
  CONSTRAINT weather_hourly_wind_direction_range CHECK (wind_direction_deg BETWEEN 0 AND 360),
  CONSTRAINT weather_hourly_cloud_cover_range CHECK (cloud_cover_pct IS NULL OR cloud_cover_pct BETWEEN 0 AND 100),
  CONSTRAINT weather_hourly_weather_code_range CHECK (weather_code BETWEEN 0 AND 99),
  CONSTRAINT weather_hourly_visibility_range CHECK (visibility_m IS NULL OR visibility_m BETWEEN 0 AND 100000),
  CONSTRAINT weather_hourly_uv_range CHECK (uv_index IS NULL OR uv_index BETWEEN 0 AND 100),
  CONSTRAINT weather_hourly_precipitation_nonnegative CHECK (precipitation_mm IS NULL OR precipitation_mm >= 0),
  CONSTRAINT weather_hourly_rain_nonnegative CHECK (rain_mm IS NULL OR rain_mm >= 0),
  CONSTRAINT weather_hourly_precipitation_probability_range CHECK (
    precipitation_probability_pct IS NULL OR precipitation_probability_pct BETWEEN 0 AND 100
  )
);
CREATE INDEX weather_hourly_points_valid_at_idx ON weather_hourly_points (valid_at);

CREATE TABLE weather_daily_points (
  forecast_run_id uuid NOT NULL REFERENCES weather_forecast_runs(id) ON DELETE CASCADE,
  valid_date date NOT NULL,
  temperature_min_c numeric(8, 3) NOT NULL,
  temperature_max_c numeric(8, 3) NOT NULL,
  weather_code integer NOT NULL,
  uv_index_max numeric(8, 3),
  precipitation_probability_max_pct numeric(6, 3),
  precipitation_mm numeric(12, 3),
  rain_mm numeric(12, 3),
  wind_speed_max_ms numeric(8, 3),
  wind_gust_max_ms numeric(8, 3),
  PRIMARY KEY (forecast_run_id, valid_date),
  CONSTRAINT weather_daily_temperature_min_range CHECK (temperature_min_c BETWEEN -100 AND 70),
  CONSTRAINT weather_daily_temperature_max_range CHECK (temperature_max_c BETWEEN -100 AND 70),
  CONSTRAINT weather_daily_temperature_order CHECK (temperature_max_c >= temperature_min_c),
  CONSTRAINT weather_daily_weather_code_range CHECK (weather_code BETWEEN 0 AND 99),
  CONSTRAINT weather_daily_uv_range CHECK (uv_index_max IS NULL OR uv_index_max BETWEEN 0 AND 100),
  CONSTRAINT weather_daily_precipitation_probability_range CHECK (
    precipitation_probability_max_pct IS NULL OR precipitation_probability_max_pct BETWEEN 0 AND 100
  ),
  CONSTRAINT weather_daily_precipitation_nonnegative CHECK (precipitation_mm IS NULL OR precipitation_mm >= 0),
  CONSTRAINT weather_daily_rain_nonnegative CHECK (rain_mm IS NULL OR rain_mm >= 0),
  CONSTRAINT weather_daily_wind_speed_nonnegative CHECK (wind_speed_max_ms IS NULL OR wind_speed_max_ms BETWEEN 0 AND 200),
  CONSTRAINT weather_daily_wind_gust_nonnegative CHECK (wind_gust_max_ms IS NULL OR wind_gust_max_ms BETWEEN 0 AND 200)
);
CREATE INDEX weather_daily_points_valid_date_idx ON weather_daily_points (valid_date);
