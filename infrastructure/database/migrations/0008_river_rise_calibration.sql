ALTER TABLE stations
  ADD COLUMN river_reach_id uuid REFERENCES river_reaches(id) ON DELETE SET NULL;

CREATE INDEX stations_river_reach_idx
  ON stations (river_reach_id)
  WHERE river_reach_id IS NOT NULL;

CREATE TABLE calibration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  model_family text NOT NULL,
  model_version text NOT NULL,
  feature_version text NOT NULL,
  source_ids text[] NOT NULL,
  training_start timestamptz NOT NULL,
  training_end timestamptz NOT NULL,
  validation_start timestamptz NOT NULL,
  validation_end timestamptz NOT NULL,
  test_start timestamptz NOT NULL,
  test_end timestamptz NOT NULL,
  split_strategy text NOT NULL,
  sample_count integer NOT NULL,
  mae_m numeric(14, 6) NOT NULL,
  rmse_m numeric(14, 6) NOT NULL,
  bias_m numeric(14, 6),
  lead_metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  artifact_sha256 char(64) NOT NULL,
  status text NOT NULL,
  baseline_model_family text,
  baseline_rmse_m numeric(14, 6),
  activated_at timestamptz,
  retired_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_runs_public_id_nonempty
    CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT calibration_runs_model_identity_nonempty
    CHECK (
      length(btrim(model_family)) > 0
      AND length(btrim(model_version)) > 0
      AND length(btrim(feature_version)) > 0
    ),
  CONSTRAINT calibration_runs_sources_nonempty
    CHECK (cardinality(source_ids) >= 1),
  CONSTRAINT calibration_runs_periods
    CHECK (
      training_end > training_start
      AND validation_end > validation_start
      AND test_end > test_start
    ),
  CONSTRAINT calibration_runs_time_ordered_holdout
    CHECK (
      split_strategy <> 'TIME_ORDERED_HOLDOUT'
      OR (
        training_end <= validation_start
        AND validation_end <= test_start
      )
    ),
  CONSTRAINT calibration_runs_split_strategy
    CHECK (
      split_strategy IN (
        'TIME_ORDERED_HOLDOUT',
        'EVENT_HOLDOUT',
        'SEASONAL_HOLDOUT'
      )
    ),
  CONSTRAINT calibration_runs_sample_count
    CHECK (sample_count >= 2),
  CONSTRAINT calibration_runs_metrics_nonnegative
    CHECK (mae_m >= 0 AND rmse_m >= 0),
  CONSTRAINT calibration_runs_rmse_ge_mae
    CHECK (rmse_m >= mae_m),
  CONSTRAINT calibration_runs_artifact_sha256
    CHECK (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT calibration_runs_status
    CHECK (
      status IN (
        'CANDIDATE',
        'APPROVED',
        'ACTIVE',
        'ROLLED_BACK',
        'REJECTED'
      )
    ),
  CONSTRAINT calibration_runs_baseline_pair
    CHECK (
      (baseline_model_family IS NULL AND baseline_rmse_m IS NULL)
      OR (
        baseline_model_family IS NOT NULL
        AND length(btrim(baseline_model_family)) > 0
        AND baseline_rmse_m IS NOT NULL
        AND baseline_rmse_m >= 0
      )
    ),
  CONSTRAINT calibration_runs_complex_model_gate
    CHECK (
      status <> 'ACTIVE'
      OR model_family IN (
        'RATING_CURVE_PIECEWISE_LINEAR',
        'PERSISTENCE'
      )
      OR (
        baseline_model_family IS NOT NULL
        AND baseline_rmse_m IS NOT NULL
        AND rmse_m < baseline_rmse_m
      )
    ),
  CONSTRAINT calibration_runs_activation_timestamp
    CHECK (
      (status = 'ACTIVE' AND activated_at IS NOT NULL)
      OR status <> 'ACTIVE'
    ),
  CONSTRAINT calibration_runs_retired_timestamp
    CHECK (
      retired_at IS NULL
      OR activated_at IS NULL
      OR retired_at >= activated_at
    )
);

CREATE UNIQUE INDEX calibration_runs_active_family_uniq
  ON calibration_runs (
    station_id,
    river_reach_id,
    model_family
  )
  WHERE status = 'ACTIVE';

CREATE INDEX calibration_runs_station_status_idx
  ON calibration_runs (
    station_id,
    river_reach_id,
    status,
    created_at DESC
  );

CREATE TABLE rating_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  calibration_run_id uuid NOT NULL REFERENCES calibration_runs(id) ON DELETE RESTRICT,
  version text NOT NULL,
  datum_id text NOT NULL,
  stage_unit text NOT NULL DEFAULT 'm',
  curve_kind text NOT NULL,
  status text NOT NULL,
  points jsonb NOT NULL,
  min_discharge_cms numeric(20, 6) NOT NULL,
  max_discharge_cms numeric(20, 6) NOT NULL,
  min_stage_m numeric(14, 6) NOT NULL,
  max_stage_m numeric(14, 6) NOT NULL,
  validation_sample_count integer NOT NULL,
  validation_mae_m numeric(14, 6) NOT NULL,
  validation_rmse_m numeric(14, 6) NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  artifact_sha256 char(64) NOT NULL,
  supersedes_rating_curve_id uuid REFERENCES rating_curves(id) ON DELETE RESTRICT,
  activated_at timestamptz,
  retired_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rating_curves_public_id_nonempty
    CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT rating_curves_version_nonempty
    CHECK (length(btrim(version)) > 0),
  CONSTRAINT rating_curves_datum_nonempty
    CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT rating_curves_stage_unit
    CHECK (stage_unit = 'm'),
  CONSTRAINT rating_curves_kind
    CHECK (curve_kind = 'PIECEWISE_LINEAR'),
  CONSTRAINT rating_curves_status
    CHECK (
      status IN (
        'CANDIDATE',
        'ACTIVE',
        'ROLLED_BACK',
        'RETIRED'
      )
    ),
  CONSTRAINT rating_curves_points_array
    CHECK (
      jsonb_typeof(points) = 'array'
      AND jsonb_array_length(points) >= 2
    ),
  CONSTRAINT rating_curves_discharge_domain
    CHECK (
      min_discharge_cms >= 0
      AND max_discharge_cms > min_discharge_cms
    ),
  CONSTRAINT rating_curves_stage_domain
    CHECK (max_stage_m > min_stage_m),
  CONSTRAINT rating_curves_validation_metrics
    CHECK (
      validation_sample_count >= 2
      AND validation_mae_m >= 0
      AND validation_rmse_m >= validation_mae_m
    ),
  CONSTRAINT rating_curves_valid_range
    CHECK (valid_to IS NULL OR valid_to > valid_from),
  CONSTRAINT rating_curves_artifact_sha256
    CHECK (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT rating_curves_activation_timestamp
    CHECK (
      (status = 'ACTIVE' AND activated_at IS NOT NULL)
      OR status <> 'ACTIVE'
    ),
  CONSTRAINT rating_curves_retired_timestamp
    CHECK (
      retired_at IS NULL
      OR activated_at IS NULL
      OR retired_at >= activated_at
    ),
  CONSTRAINT rating_curves_not_self_supersede
    CHECK (
      supersedes_rating_curve_id IS NULL
      OR supersedes_rating_curve_id <> id
    )
);

CREATE UNIQUE INDEX rating_curves_active_datum_uniq
  ON rating_curves (
    station_id,
    river_reach_id,
    datum_id
  )
  WHERE status = 'ACTIVE';

CREATE INDEX rating_curves_station_status_idx
  ON rating_curves (
    station_id,
    river_reach_id,
    datum_id,
    status,
    valid_from DESC
  );

CREATE TABLE river_stage_forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  rating_curve_id uuid NOT NULL REFERENCES rating_curves(id) ON DELETE RESTRICT,
  calibration_run_id uuid NOT NULL REFERENCES calibration_runs(id) ON DELETE RESTRICT,
  source_hydrology_run_id uuid REFERENCES hydrology_forecast_runs(id) ON DELETE RESTRICT,
  model_run_at timestamptz NOT NULL,
  generated_at timestamptz NOT NULL,
  stale_after timestamptz NOT NULL,
  datum_id text NOT NULL,
  stage_unit text NOT NULL DEFAULT 'm',
  normalized_checksum char(64) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT river_stage_forecast_runs_datum_nonempty
    CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT river_stage_forecast_runs_stage_unit
    CHECK (stage_unit = 'm'),
  CONSTRAINT river_stage_forecast_runs_stale_after
    CHECK (stale_after >= generated_at),
  CONSTRAINT river_stage_forecast_runs_checksum
    CHECK (normalized_checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT river_stage_forecast_runs_idempotent
    UNIQUE (
      station_id,
      river_reach_id,
      rating_curve_id,
      normalized_checksum
    )
);

CREATE INDEX river_stage_forecast_runs_station_time_idx
  ON river_stage_forecast_runs (
    station_id,
    river_reach_id,
    generated_at DESC
  );

CREATE TABLE river_stage_forecast_points (
  stage_run_id uuid NOT NULL REFERENCES river_stage_forecast_runs(id) ON DELETE CASCADE,
  valid_at timestamptz NOT NULL,
  lead_seconds integer NOT NULL,
  discharge_cms numeric(20, 6) NOT NULL,
  stage_m numeric(14, 6) NOT NULL,
  uncertainty_m numeric(14, 6) NOT NULL,
  domain_status text NOT NULL,
  quality_state text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stage_run_id, valid_at),
  CONSTRAINT river_stage_forecast_points_lead
    CHECK (lead_seconds >= 0),
  CONSTRAINT river_stage_forecast_points_discharge
    CHECK (discharge_cms >= 0),
  CONSTRAINT river_stage_forecast_points_uncertainty
    CHECK (uncertainty_m >= 0),
  CONSTRAINT river_stage_forecast_points_domain_status
    CHECK (domain_status IN ('BOUNDARY', 'INTERPOLATED')),
  CONSTRAINT river_stage_forecast_points_quality
    CHECK (quality_state IN ('DERIVED', 'STALE', 'SUSPECT'))
);

CREATE INDEX river_stage_forecast_points_valid_idx
  ON river_stage_forecast_points (valid_at);
