CREATE TABLE river_reaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  river_id uuid REFERENCES rivers(id) ON DELETE SET NULL,
  basin_id uuid REFERENCES basins(id) ON DELETE SET NULL,
  name text NOT NULL,
  geometry geometry(MultiLineString, 4326),
  geometry_source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT river_reaches_public_id_nonempty CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT river_reaches_name_nonempty CHECK (length(btrim(name)) > 0)
);

CREATE INDEX river_reaches_river_idx ON river_reaches (river_id);
CREATE INDEX river_reaches_basin_idx ON river_reaches (basin_id);
CREATE INDEX river_reaches_geometry_gist_idx
  ON river_reaches USING GIST (geometry)
  WHERE geometry IS NOT NULL;

CREATE TABLE river_reach_provider_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE CASCADE,
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE CASCADE,
  provider_reach_id text NOT NULL,
  provider_product_id text NOT NULL,
  provider_product_version text,
  mapping_state text NOT NULL,
  mapping_method text NOT NULL,
  confidence numeric(5, 4) NOT NULL,
  distance_km numeric(14, 6),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT river_reach_provider_mappings_provider_reach_nonempty
    CHECK (length(btrim(provider_reach_id)) > 0),
  CONSTRAINT river_reach_provider_mappings_product_nonempty
    CHECK (length(btrim(provider_product_id)) > 0),
  CONSTRAINT river_reach_provider_mappings_state
    CHECK (mapping_state IN ('MAPPED', 'AMBIGUOUS')),
  CONSTRAINT river_reach_provider_mappings_method
    CHECK (
      mapping_method IN (
        'PROVIDER_ID',
        'MANUAL',
        'NAME_SPATIAL',
        'NEAREST_GEOMETRY',
        'MODEL_GRID_CELL'
      )
    ),
  CONSTRAINT river_reach_provider_mappings_confidence
    CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT river_reach_provider_mappings_distance
    CHECK (distance_km IS NULL OR distance_km >= 0),
  CONSTRAINT river_reach_provider_mappings_effective_range
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX river_reach_provider_mappings_reach_provider_idx
  ON river_reach_provider_mappings (
    river_reach_id,
    provider_config_id,
    mapping_state,
    confidence DESC
  );
CREATE INDEX river_reach_provider_mappings_provider_reach_idx
  ON river_reach_provider_mappings (
    provider_config_id,
    provider_product_id,
    provider_reach_id
  );
CREATE UNIQUE INDEX river_reach_provider_mappings_current_selected_uniq
  ON river_reach_provider_mappings (
    river_reach_id,
    provider_config_id,
    provider_product_id
  )
  WHERE mapping_state = 'MAPPED' AND effective_to IS NULL;

CREATE TABLE hydrology_forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  source_registry_id text NOT NULL,
  capability text NOT NULL,
  provider_reach_id text NOT NULL,
  product_id text NOT NULL,
  product_version text,
  model_run_at timestamptz,
  fetched_at timestamptz NOT NULL,
  stale_after timestamptz NOT NULL,
  attribution_text text NOT NULL,
  attribution_url text,
  normalized_checksum text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hydrology_forecast_runs_source_nonempty
    CHECK (length(btrim(source_registry_id)) > 0),
  CONSTRAINT hydrology_forecast_runs_capability
    CHECK (
      capability IN (
        'hydrology.dischargeForecast',
        'hydrology.dischargeEnsemble',
        'hydrology.retrospective',
        'hydrology.returnPeriods'
      )
    ),
  CONSTRAINT hydrology_forecast_runs_provider_reach_nonempty
    CHECK (length(btrim(provider_reach_id)) > 0),
  CONSTRAINT hydrology_forecast_runs_product_nonempty
    CHECK (length(btrim(product_id)) > 0),
  CONSTRAINT hydrology_forecast_runs_attribution_nonempty
    CHECK (length(btrim(attribution_text)) > 0),
  CONSTRAINT hydrology_forecast_runs_checksum_sha256
    CHECK (normalized_checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT hydrology_forecast_runs_stale_after
    CHECK (stale_after >= fetched_at),
  CONSTRAINT hydrology_forecast_runs_forecast_model_run
    CHECK (
      capability NOT IN ('hydrology.dischargeForecast', 'hydrology.dischargeEnsemble')
      OR model_run_at IS NOT NULL
    ),
  CONSTRAINT hydrology_forecast_runs_idempotent
    UNIQUE (
      provider_config_id,
      river_reach_id,
      capability,
      provider_reach_id,
      normalized_checksum
    )
);

CREATE INDEX hydrology_forecast_runs_reach_time_idx
  ON hydrology_forecast_runs (river_reach_id, capability, fetched_at DESC);
CREATE INDEX hydrology_forecast_runs_provider_time_idx
  ON hydrology_forecast_runs (provider_config_id, capability, fetched_at DESC);

CREATE TABLE hydrology_discharge_points (
  hydrology_run_id uuid NOT NULL REFERENCES hydrology_forecast_runs(id) ON DELETE CASCADE,
  external_record_id text NOT NULL,
  product_kind text NOT NULL,
  valid_at timestamptz NOT NULL,
  lead_seconds integer,
  discharge_cms numeric(20, 6) NOT NULL,
  unit text NOT NULL DEFAULT 'm3/s',
  ensemble_member integer,
  statistic text,
  quality_state text NOT NULL,
  quality_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hydrology_run_id, external_record_id),
  CONSTRAINT hydrology_discharge_points_external_id_nonempty
    CHECK (length(btrim(external_record_id)) > 0),
  CONSTRAINT hydrology_discharge_points_product_kind
    CHECK (
      product_kind IN (
        'FORECAST_MEAN',
        'FORECAST_STATISTIC',
        'FORECAST_ENSEMBLE_MEMBER',
        'RETROSPECTIVE_SIMULATION'
      )
    ),
  CONSTRAINT hydrology_discharge_points_lead_nonnegative
    CHECK (lead_seconds IS NULL OR lead_seconds >= 0),
  CONSTRAINT hydrology_discharge_points_discharge_nonnegative
    CHECK (discharge_cms >= 0),
  CONSTRAINT hydrology_discharge_points_unit
    CHECK (unit = 'm3/s'),
  CONSTRAINT hydrology_discharge_points_ensemble_member
    CHECK (ensemble_member IS NULL OR ensemble_member >= 0),
  CONSTRAINT hydrology_discharge_points_statistic
    CHECK (
      statistic IS NULL
      OR statistic IN ('MEAN', 'MEDIAN', 'MIN', 'MAX', 'P10', 'P25', 'P75', 'P90')
    ),
  CONSTRAINT hydrology_discharge_points_quality
    CHECK (
      quality_state IN ('VALID', 'ESTIMATED', 'SIMULATED', 'SUSPECT', 'MISSING')
    ),
  CONSTRAINT hydrology_discharge_points_product_semantics
    CHECK (
      (
        product_kind = 'FORECAST_MEAN'
        AND lead_seconds IS NOT NULL
        AND ensemble_member IS NULL
        AND statistic = 'MEAN'
      )
      OR (
        product_kind = 'FORECAST_STATISTIC'
        AND lead_seconds IS NOT NULL
        AND ensemble_member IS NULL
        AND statistic IS NOT NULL
      )
      OR (
        product_kind = 'FORECAST_ENSEMBLE_MEMBER'
        AND lead_seconds IS NOT NULL
        AND ensemble_member IS NOT NULL
        AND statistic IS NULL
      )
      OR (
        product_kind = 'RETROSPECTIVE_SIMULATION'
        AND lead_seconds IS NULL
        AND ensemble_member IS NULL
        AND statistic IS NULL
        AND quality_state = 'SIMULATED'
      )
    )
);

CREATE INDEX hydrology_discharge_points_run_valid_idx
  ON hydrology_discharge_points (hydrology_run_id, valid_at);
CREATE INDEX hydrology_discharge_points_valid_idx
  ON hydrology_discharge_points (valid_at);

CREATE TABLE hydrology_return_periods (
  hydrology_run_id uuid NOT NULL REFERENCES hydrology_forecast_runs(id) ON DELETE CASCADE,
  return_period_years integer NOT NULL,
  discharge_cms numeric(20, 6) NOT NULL,
  unit text NOT NULL DEFAULT 'm3/s',
  retrospective_period_start timestamptz,
  retrospective_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hydrology_run_id, return_period_years),
  CONSTRAINT hydrology_return_periods_years
    CHECK (return_period_years >= 2 AND return_period_years <= 10000),
  CONSTRAINT hydrology_return_periods_discharge
    CHECK (discharge_cms >= 0),
  CONSTRAINT hydrology_return_periods_unit
    CHECK (unit = 'm3/s'),
  CONSTRAINT hydrology_return_periods_retrospective_range
    CHECK (
      retrospective_period_start IS NULL
      OR retrospective_period_end IS NULL
      OR retrospective_period_end > retrospective_period_start
    )
);
