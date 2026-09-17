CREATE TABLE rainfall_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE RESTRICT,
  source_registry_id text NOT NULL,
  capability text NOT NULL,
  spatial_point geography(Point, 4326) NOT NULL,
  spatial_representation text NOT NULL,
  resolution_km numeric(12, 4),
  station_public_id text,
  product_id text NOT NULL,
  product_version text,
  model_run_at timestamptz,
  fetched_at timestamptz NOT NULL,
  stale_after timestamptz NOT NULL,
  attribution_text text NOT NULL,
  attribution_url text,
  normalized_checksum char(64) NOT NULL,
  object_uris text[] NOT NULL DEFAULT ARRAY[]::text[],
  object_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rainfall_runs_source_nonempty CHECK (length(btrim(source_registry_id)) > 0),
  CONSTRAINT rainfall_runs_capability CHECK (
    capability IN ('rainfall.observed', 'rainfall.satellite', 'rainfall.radar', 'rainfall.forecast')
  ),
  CONSTRAINT rainfall_runs_spatial_representation CHECK (
    spatial_representation IN ('GAUGE', 'POINT', 'GRID_CELL', 'BASIN_AGGREGATE')
  ),
  CONSTRAINT rainfall_runs_resolution_positive CHECK (resolution_km IS NULL OR resolution_km > 0),
  CONSTRAINT rainfall_runs_product_nonempty CHECK (length(btrim(product_id)) > 0),
  CONSTRAINT rainfall_runs_attribution_nonempty CHECK (length(btrim(attribution_text)) > 0),
  CONSTRAINT rainfall_runs_stale_order CHECK (stale_after >= fetched_at),
  CONSTRAINT rainfall_runs_checksum_format CHECK (normalized_checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT rainfall_runs_gauge_station CHECK (
    (spatial_representation = 'GAUGE' AND station_public_id IS NOT NULL AND length(btrim(station_public_id)) > 0)
    OR spatial_representation <> 'GAUGE'
  ),
  CONSTRAINT rainfall_runs_provider_capability_checksum_unique UNIQUE (
    provider_config_id, capability, normalized_checksum
  )
);

CREATE INDEX rainfall_runs_spatial_gist_idx ON rainfall_runs USING GIST (spatial_point);
CREATE INDEX rainfall_runs_capability_fetched_idx ON rainfall_runs (capability, fetched_at DESC);
CREATE INDEX rainfall_runs_stale_after_idx ON rainfall_runs (stale_after);

CREATE TABLE rainfall_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rainfall_run_id uuid NOT NULL REFERENCES rainfall_runs(id) ON DELETE CASCADE,
  external_record_id text NOT NULL,
  product_kind text NOT NULL,
  valid_start timestamptz NOT NULL,
  valid_end timestamptz NOT NULL,
  accumulation_seconds integer NOT NULL,
  amount_mm numeric(14, 4) NOT NULL,
  quality_state text NOT NULL,
  quality_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_registry_id text NOT NULL,
  product_id text NOT NULL,
  product_version text,
  model_run_at timestamptz,
  observed_at timestamptz,
  fetched_at timestamptz NOT NULL,
  attribution_text text NOT NULL,
  attribution_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rainfall_records_external_id_nonempty CHECK (length(btrim(external_record_id)) > 0),
  CONSTRAINT rainfall_records_product_kind CHECK (
    product_kind IN (
      'GAUGE_OBSERVATION',
      'RADAR_ESTIMATE',
      'SATELLITE_ESTIMATE',
      'REANALYSIS',
      'DETERMINISTIC_FORECAST',
      'ENSEMBLE_FORECAST',
      'BLENDED_DERIVED'
    )
  ),
  CONSTRAINT rainfall_records_interval_order CHECK (valid_end > valid_start),
  CONSTRAINT rainfall_records_accumulation_positive CHECK (accumulation_seconds > 0),
  CONSTRAINT rainfall_records_accumulation_matches_interval CHECK (
    accumulation_seconds = EXTRACT(EPOCH FROM (valid_end - valid_start))::integer
  ),
  CONSTRAINT rainfall_records_amount_nonnegative CHECK (amount_mm >= 0),
  CONSTRAINT rainfall_records_quality_state CHECK (
    quality_state IN ('VALID', 'ESTIMATED', 'SUSPECT', 'MISSING')
  ),
  CONSTRAINT rainfall_records_source_nonempty CHECK (length(btrim(source_registry_id)) > 0),
  CONSTRAINT rainfall_records_product_nonempty CHECK (length(btrim(product_id)) > 0),
  CONSTRAINT rainfall_records_attribution_nonempty CHECK (length(btrim(attribution_text)) > 0),
  CONSTRAINT rainfall_records_run_external_unique UNIQUE (rainfall_run_id, external_record_id)
);

CREATE INDEX rainfall_records_valid_interval_idx
  ON rainfall_records (valid_start, valid_end);
CREATE INDEX rainfall_records_kind_valid_end_idx
  ON rainfall_records (product_kind, valid_end DESC);

CREATE TABLE rainfall_accumulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rainfall_run_id uuid NOT NULL REFERENCES rainfall_runs(id) ON DELETE CASCADE,
  end_at timestamptz NOT NULL,
  window_seconds integer NOT NULL,
  amount_mm numeric(14, 4),
  coverage_ratio numeric(8, 6) NOT NULL,
  complete boolean NOT NULL,
  derivation_version text NOT NULL,
  input_record_ids text[] NOT NULL,
  source_ids text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rainfall_accumulations_window_supported CHECK (
    window_seconds IN (3600, 10800, 21600, 43200, 86400, 259200, 604800)
  ),
  CONSTRAINT rainfall_accumulations_amount_nonnegative CHECK (amount_mm IS NULL OR amount_mm >= 0),
  CONSTRAINT rainfall_accumulations_coverage_range CHECK (coverage_ratio BETWEEN 0 AND 1),
  CONSTRAINT rainfall_accumulations_complete_coverage CHECK (NOT complete OR coverage_ratio = 1),
  CONSTRAINT rainfall_accumulations_derivation_nonempty CHECK (length(btrim(derivation_version)) > 0),
  CONSTRAINT rainfall_accumulations_run_window_version_unique UNIQUE (
    rainfall_run_id, end_at, window_seconds, derivation_version
  )
);

CREATE INDEX rainfall_accumulations_end_window_idx
  ON rainfall_accumulations (end_at DESC, window_seconds);
