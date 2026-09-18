CREATE TABLE gauge_reach_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE CASCADE,
  link_state text NOT NULL DEFAULT 'MAPPED',
  link_method text NOT NULL,
  confidence numeric(5, 4) NOT NULL,
  distance_km numeric(14, 6),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gauge_reach_links_state
    CHECK (link_state IN ('MAPPED', 'AMBIGUOUS')),
  CONSTRAINT gauge_reach_links_method
    CHECK (link_method IN ('MANUAL', 'STATION_RIVER_ID', 'NAME_SPATIAL', 'NEAREST_GEOMETRY')),
  CONSTRAINT gauge_reach_links_confidence
    CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT gauge_reach_links_distance
    CHECK (distance_km IS NULL OR distance_km >= 0),
  CONSTRAINT gauge_reach_links_effective_range
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE UNIQUE INDEX gauge_reach_links_current_candidate_uniq
  ON gauge_reach_links (station_id, river_reach_id, link_state)
  WHERE effective_to IS NULL;
CREATE UNIQUE INDEX gauge_reach_links_current_mapped_station_uniq
  ON gauge_reach_links (station_id)
  WHERE effective_to IS NULL AND link_state = 'MAPPED';
CREATE INDEX gauge_reach_links_reach_idx
  ON gauge_reach_links (river_reach_id, link_state, confidence DESC);

CREATE TABLE calibration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  version text NOT NULL,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  datum_id text NOT NULL,
  model_kind text NOT NULL,
  model_version text NOT NULL,
  feature_version text NOT NULL,
  split_strategy text NOT NULL,
  train_start timestamptz NOT NULL,
  train_end timestamptz NOT NULL,
  validation_start timestamptz NOT NULL,
  validation_end timestamptz NOT NULL,
  test_start timestamptz,
  test_end timestamptz,
  validation_mae_m numeric(18, 6),
  validation_rmse_m numeric(18, 6),
  validation_sample_count integer,
  test_mae_m numeric(18, 6),
  test_rmse_m numeric(18, 6),
  test_sample_count integer,
  accepted_test_rmse_m numeric(18, 6),
  source_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  artifact_checksum_sha256 char(64) NOT NULL,
  artifact_uri text,
  deployment_status text NOT NULL DEFAULT 'CANDIDATE',
  validated_at timestamptz,
  activated_at timestamptz,
  rolled_back_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_runs_public_id_nonempty CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT calibration_runs_version_nonempty CHECK (length(btrim(version)) > 0),
  CONSTRAINT calibration_runs_datum_nonempty CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT calibration_runs_model_kind
    CHECK (model_kind IN ('RATING_CURVE', 'PERSISTENCE_BASELINE', 'LINEAR_REGRESSION', 'REGULARIZED_REGRESSION')),
  CONSTRAINT calibration_runs_model_version_nonempty CHECK (length(btrim(model_version)) > 0),
  CONSTRAINT calibration_runs_feature_version_nonempty CHECK (length(btrim(feature_version)) > 0),
  CONSTRAINT calibration_runs_split_strategy
    CHECK (split_strategy IN ('CHRONOLOGICAL_HOLDOUT', 'EVENT_HOLDOUT', 'ROLLING_ORIGIN')),
  CONSTRAINT calibration_runs_train_range CHECK (train_end > train_start),
  CONSTRAINT calibration_runs_validation_range CHECK (
    validation_end > validation_start AND validation_start >= train_end
  ),
  CONSTRAINT calibration_runs_test_range CHECK (
    (test_start IS NULL AND test_end IS NULL)
    OR (
      test_start IS NOT NULL
      AND test_end IS NOT NULL
      AND test_end > test_start
      AND test_start >= validation_end
    )
  ),
  CONSTRAINT calibration_runs_validation_metrics CHECK (
    (validation_mae_m IS NULL AND validation_rmse_m IS NULL AND validation_sample_count IS NULL)
    OR (
      validation_mae_m >= 0
      AND validation_rmse_m >= validation_mae_m
      AND validation_sample_count > 0
    )
  ),
  CONSTRAINT calibration_runs_test_metrics CHECK (
    (test_mae_m IS NULL AND test_rmse_m IS NULL AND test_sample_count IS NULL)
    OR (
      test_mae_m >= 0
      AND test_rmse_m >= test_mae_m
      AND test_sample_count > 0
    )
  ),
  CONSTRAINT calibration_runs_accepted_rmse
    CHECK (accepted_test_rmse_m IS NULL OR accepted_test_rmse_m >= 0),
  CONSTRAINT calibration_runs_source_summary_array
    CHECK (jsonb_typeof(source_summary) = 'array'),
  CONSTRAINT calibration_runs_checksum_sha256
    CHECK (artifact_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT calibration_runs_deployment_status
    CHECK (deployment_status IN ('CANDIDATE', 'ACTIVE', 'SUPERSEDED', 'ROLLED_BACK', 'REJECTED')),
  CONSTRAINT calibration_runs_active_evidence CHECK (
    deployment_status <> 'ACTIVE'
    OR (
      test_start IS NOT NULL
      AND test_end IS NOT NULL
      AND validation_mae_m IS NOT NULL
      AND validation_rmse_m IS NOT NULL
      AND validation_sample_count IS NOT NULL
      AND test_mae_m IS NOT NULL
      AND test_rmse_m IS NOT NULL
      AND test_sample_count IS NOT NULL
      AND accepted_test_rmse_m IS NOT NULL
      AND test_rmse_m <= accepted_test_rmse_m
      AND validated_at IS NOT NULL
      AND activated_at IS NOT NULL
    )
  ),
  CONSTRAINT calibration_runs_station_reach_version_unique
    UNIQUE (station_id, river_reach_id, model_kind, version)
);

CREATE UNIQUE INDEX calibration_runs_active_scope_uniq
  ON calibration_runs (station_id, river_reach_id, model_kind)
  WHERE deployment_status = 'ACTIVE';
CREATE INDEX calibration_runs_reach_status_idx
  ON calibration_runs (river_reach_id, model_kind, deployment_status, created_at DESC);

CREATE TABLE calibration_metric_breakdowns (
  calibration_run_id uuid NOT NULL REFERENCES calibration_runs(id) ON DELETE CASCADE,
  dataset_split text NOT NULL,
  lead_seconds integer,
  season text,
  event_subset text,
  mae_m numeric(18, 6) NOT NULL,
  rmse_m numeric(18, 6) NOT NULL,
  sample_count integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calibration_metric_breakdowns_split
    CHECK (dataset_split IN ('VALIDATION', 'TEST')),
  CONSTRAINT calibration_metric_breakdowns_lead
    CHECK (lead_seconds IS NULL OR lead_seconds >= 0),
  CONSTRAINT calibration_metric_breakdowns_identity
    CHECK (lead_seconds IS NOT NULL OR season IS NOT NULL OR event_subset IS NOT NULL),
  CONSTRAINT calibration_metric_breakdowns_metrics
    CHECK (mae_m >= 0 AND rmse_m >= mae_m AND sample_count > 0),
  CONSTRAINT calibration_metric_breakdowns_identity_unique
    UNIQUE NULLS NOT DISTINCT (
      calibration_run_id,
      dataset_split,
      lead_seconds,
      season,
      event_subset
    )
);

CREATE TABLE rating_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  calibration_run_id uuid NOT NULL REFERENCES calibration_runs(id) ON DELETE RESTRICT,
  curve_version text NOT NULL,
  datum_id text NOT NULL,
  method text NOT NULL DEFAULT 'PIECEWISE_LINEAR',
  stage_unit text NOT NULL DEFAULT 'm',
  discharge_unit text NOT NULL DEFAULT 'm3/s',
  valid_discharge_min_cms numeric(20, 6) NOT NULL,
  valid_discharge_max_cms numeric(20, 6) NOT NULL,
  extrapolation_policy text NOT NULL DEFAULT 'REJECT',
  status text NOT NULL DEFAULT 'CANDIDATE',
  curve_checksum_sha256 char(64) NOT NULL,
  effective_from timestamptz,
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rating_curves_public_id_nonempty CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT rating_curves_version_nonempty CHECK (length(btrim(curve_version)) > 0),
  CONSTRAINT rating_curves_datum_nonempty CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT rating_curves_method CHECK (method = 'PIECEWISE_LINEAR'),
  CONSTRAINT rating_curves_stage_unit CHECK (stage_unit = 'm'),
  CONSTRAINT rating_curves_discharge_unit CHECK (discharge_unit = 'm3/s'),
  CONSTRAINT rating_curves_domain CHECK (
    valid_discharge_min_cms >= 0
    AND valid_discharge_max_cms > valid_discharge_min_cms
  ),
  CONSTRAINT rating_curves_extrapolation CHECK (extrapolation_policy = 'REJECT'),
  CONSTRAINT rating_curves_status CHECK (status IN ('CANDIDATE', 'ACTIVE', 'SUPERSEDED', 'REJECTED')),
  CONSTRAINT rating_curves_checksum_sha256 CHECK (curve_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT rating_curves_effective_range CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT rating_curves_active_effective CHECK (
    status <> 'ACTIVE' OR (effective_from IS NOT NULL AND effective_to IS NULL)
  ),
  CONSTRAINT rating_curves_scope_version_unique
    UNIQUE (station_id, river_reach_id, datum_id, curve_version)
);

CREATE UNIQUE INDEX rating_curves_active_scope_uniq
  ON rating_curves (station_id, river_reach_id, datum_id)
  WHERE status = 'ACTIVE';
CREATE INDEX rating_curves_reach_status_idx
  ON rating_curves (river_reach_id, status, effective_from DESC);

CREATE TABLE rating_curve_points (
  rating_curve_id uuid NOT NULL REFERENCES rating_curves(id) ON DELETE CASCADE,
  point_order integer NOT NULL,
  discharge_cms numeric(20, 6) NOT NULL,
  stage_m numeric(18, 6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rating_curve_id, point_order),
  CONSTRAINT rating_curve_points_order CHECK (point_order >= 0),
  CONSTRAINT rating_curve_points_discharge CHECK (discharge_cms >= 0),
  CONSTRAINT rating_curve_points_discharge_unique UNIQUE (rating_curve_id, discharge_cms)
);

CREATE TABLE stage_forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  river_reach_id uuid NOT NULL REFERENCES river_reaches(id) ON DELETE RESTRICT,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  calibration_run_id uuid NOT NULL REFERENCES calibration_runs(id) ON DELETE RESTRICT,
  rating_curve_id uuid NOT NULL REFERENCES rating_curves(id) ON DELETE RESTRICT,
  input_hydrology_run_id uuid NOT NULL REFERENCES hydrology_forecast_runs(id) ON DELETE RESTRICT,
  generated_at timestamptz NOT NULL,
  horizon_start timestamptz NOT NULL,
  horizon_end timestamptz NOT NULL,
  datum_id text NOT NULL,
  evidence_status text NOT NULL,
  test_mae_m numeric(18, 6) NOT NULL,
  test_rmse_m numeric(18, 6) NOT NULL,
  normalized_checksum char(64) NOT NULL,
  limitations text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stage_forecast_runs_horizon CHECK (horizon_end >= horizon_start),
  CONSTRAINT stage_forecast_runs_datum_nonempty CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT stage_forecast_runs_evidence CHECK (evidence_status IN ('AVAILABLE', 'PARTIAL')),
  CONSTRAINT stage_forecast_runs_metrics CHECK (
    test_mae_m >= 0 AND test_rmse_m >= test_mae_m
  ),
  CONSTRAINT stage_forecast_runs_checksum_sha256
    CHECK (normalized_checksum ~ '^[0-9a-f]{64}$'),
  CONSTRAINT stage_forecast_runs_idempotent
    UNIQUE (
      river_reach_id,
      station_id,
      rating_curve_id,
      input_hydrology_run_id,
      normalized_checksum
    )
);

CREATE INDEX stage_forecast_runs_reach_generated_idx
  ON stage_forecast_runs (river_reach_id, generated_at DESC);

CREATE TABLE stage_forecast_points (
  stage_forecast_run_id uuid NOT NULL REFERENCES stage_forecast_runs(id) ON DELETE CASCADE,
  external_discharge_record_id text NOT NULL,
  valid_at timestamptz NOT NULL,
  lead_seconds integer NOT NULL,
  discharge_cms numeric(20, 6) NOT NULL,
  derivation_status text NOT NULL,
  stage_m numeric(18, 6),
  datum_id text NOT NULL,
  extrapolated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stage_forecast_run_id, external_discharge_record_id),
  CONSTRAINT stage_forecast_points_external_id_nonempty
    CHECK (length(btrim(external_discharge_record_id)) > 0),
  CONSTRAINT stage_forecast_points_lead CHECK (lead_seconds >= 0),
  CONSTRAINT stage_forecast_points_discharge CHECK (discharge_cms >= 0),
  CONSTRAINT stage_forecast_points_status
    CHECK (derivation_status IN ('AVAILABLE', 'OUTSIDE_CALIBRATED_DOMAIN', 'DATUM_MISMATCH')),
  CONSTRAINT stage_forecast_points_stage_semantics CHECK (
    (derivation_status = 'AVAILABLE' AND stage_m IS NOT NULL AND extrapolated = false)
    OR (
      derivation_status IN ('OUTSIDE_CALIBRATED_DOMAIN', 'DATUM_MISMATCH')
      AND stage_m IS NULL
      AND extrapolated = false
    )
  ),
  CONSTRAINT stage_forecast_points_datum_nonempty CHECK (length(btrim(datum_id)) > 0)
);

CREATE INDEX stage_forecast_points_valid_idx
  ON stage_forecast_points (stage_forecast_run_id, valid_at);
