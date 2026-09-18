-- Phase 5F: deterministic flood-risk assessments, probability-calibration gate,
-- and backtesting evidence. Exact end-user point coordinates are intentionally
-- not persisted by this migration.


CREATE TABLE flood_susceptibility_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  source_id text NOT NULL,
  version text NOT NULL,
  level text NOT NULL,
  resolution_m numeric(18, 3) NOT NULL,
  geometry geometry(MultiPolygon, 4326) NOT NULL,
  limitation text NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flood_susceptibility_public_nonempty
    CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT flood_susceptibility_source_nonempty
    CHECK (length(btrim(source_id)) > 0),
  CONSTRAINT flood_susceptibility_version_nonempty
    CHECK (length(btrim(version)) > 0),
  CONSTRAINT flood_susceptibility_level
    CHECK (level IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
  CONSTRAINT flood_susceptibility_resolution
    CHECK (resolution_m > 0),
  CONSTRAINT flood_susceptibility_limitation_nonempty
    CHECK (length(btrim(limitation)) > 0),
  CONSTRAINT flood_susceptibility_effective_range
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT flood_susceptibility_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX flood_susceptibility_geometry_gix
  ON flood_susceptibility_baselines
  USING gist (geometry);
CREATE INDEX flood_susceptibility_effective_idx
  ON flood_susceptibility_baselines
  (effective_from, effective_to);

CREATE TABLE flood_probability_calibrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  version text NOT NULL,
  model_version text NOT NULL,
  event_definition text NOT NULL,
  validation_start timestamptz NOT NULL,
  validation_end timestamptz NOT NULL,
  sample_count integer NOT NULL,
  brier_score numeric(12, 8) NOT NULL,
  artifact_checksum_sha256 char(64) NOT NULL,
  status text NOT NULL DEFAULT 'CANDIDATE',
  validated_at timestamptz,
  activated_at timestamptz,
  retired_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flood_probability_calibrations_public_nonempty
    CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT flood_probability_calibrations_version_nonempty
    CHECK (length(btrim(version)) > 0),
  CONSTRAINT flood_probability_calibrations_model_nonempty
    CHECK (length(btrim(model_version)) > 0),
  CONSTRAINT flood_probability_calibrations_event_nonempty
    CHECK (length(btrim(event_definition)) >= 20),
  CONSTRAINT flood_probability_calibrations_period
    CHECK (validation_end > validation_start),
  CONSTRAINT flood_probability_calibrations_samples
    CHECK (sample_count >= 30),
  CONSTRAINT flood_probability_calibrations_brier
    CHECK (brier_score >= 0 AND brier_score <= 1),
  CONSTRAINT flood_probability_calibrations_checksum
    CHECK (artifact_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT flood_probability_calibrations_status
    CHECK (status IN ('CANDIDATE', 'VALIDATED', 'ACTIVE', 'RETIRED')),
  CONSTRAINT flood_probability_calibrations_active_evidence
    CHECK (
      status <> 'ACTIVE'
      OR (
        validated_at IS NOT NULL
        AND activated_at IS NOT NULL
      )
    ),
  CONSTRAINT flood_probability_calibrations_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX flood_probability_calibrations_one_active_model
  ON flood_probability_calibrations (model_version)
  WHERE status = 'ACTIVE';

CREATE TABLE flood_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  scope_kind text NOT NULL,
  scope_public_id text NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  generated_at timestamptz NOT NULL,
  risk_level text NOT NULL,
  confidence text NOT NULL,
  hydrologic_hazard jsonb NOT NULL,
  inundation_susceptibility jsonb NOT NULL,
  local_impact jsonb NOT NULL,
  drivers jsonb NOT NULL,
  reasons jsonb NOT NULL,
  source_summary jsonb NOT NULL,
  model_version text NOT NULL,
  freshness jsonb NOT NULL,
  limitations jsonb NOT NULL,
  probability_min numeric(12, 8),
  probability_max numeric(12, 8),
  probability_calibration_id uuid
    REFERENCES flood_probability_calibrations(id) ON DELETE RESTRICT,
  input_checksum_sha256 char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flood_risk_assessments_scope
    CHECK (scope_kind IN ('REACH', 'BASIN')),
  CONSTRAINT flood_risk_assessments_scope_nonempty
    CHECK (length(btrim(scope_public_id)) > 0),
  CONSTRAINT flood_risk_assessments_period
    CHECK (valid_to > valid_from),
  CONSTRAINT flood_risk_assessments_risk
    CHECK (
      risk_level IN (
        'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'EXTREME',
        'INSUFFICIENT_DATA'
      )
    ),
  CONSTRAINT flood_risk_assessments_confidence
    CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  CONSTRAINT flood_risk_assessments_model_nonempty
    CHECK (length(btrim(model_version)) > 0),
  CONSTRAINT flood_risk_assessments_checksum
    CHECK (input_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT flood_risk_assessments_json_shapes
    CHECK (
      jsonb_typeof(hydrologic_hazard) = 'object'
      AND jsonb_typeof(inundation_susceptibility) = 'object'
      AND jsonb_typeof(local_impact) = 'object'
      AND jsonb_typeof(drivers) = 'array'
      AND jsonb_typeof(reasons) = 'array'
      AND jsonb_typeof(source_summary) = 'array'
      AND jsonb_typeof(freshness) = 'object'
      AND jsonb_typeof(limitations) = 'array'
    ),
  CONSTRAINT flood_risk_assessments_probability_pair
    CHECK (
      (
        probability_min IS NULL
        AND probability_max IS NULL
        AND probability_calibration_id IS NULL
      )
      OR
      (
        probability_min IS NOT NULL
        AND probability_max IS NOT NULL
        AND probability_calibration_id IS NOT NULL
        AND probability_min >= 0
        AND probability_max <= 1
        AND probability_max >= probability_min
        AND risk_level <> 'INSUFFICIENT_DATA'
      )
    )
);

CREATE UNIQUE INDEX flood_risk_assessments_idempotent_uniq
  ON flood_risk_assessments (
    scope_kind,
    scope_public_id,
    model_version,
    input_checksum_sha256
  );
CREATE INDEX flood_risk_assessments_scope_time_idx
  ON flood_risk_assessments (
    scope_kind,
    scope_public_id,
    generated_at DESC
  );

CREATE TABLE flood_risk_backtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  model_version text NOT NULL,
  event_definition text NOT NULL,
  evaluation_start timestamptz NOT NULL,
  evaluation_end timestamptz NOT NULL,
  sample_count integer NOT NULL,
  metrics jsonb NOT NULL,
  artifact_checksum_sha256 char(64) NOT NULL,
  status text NOT NULL DEFAULT 'CANDIDATE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flood_risk_backtest_public_nonempty
    CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT flood_risk_backtest_model_nonempty
    CHECK (length(btrim(model_version)) > 0),
  CONSTRAINT flood_risk_backtest_event_nonempty
    CHECK (length(btrim(event_definition)) >= 20),
  CONSTRAINT flood_risk_backtest_period
    CHECK (evaluation_end > evaluation_start),
  CONSTRAINT flood_risk_backtest_samples
    CHECK (sample_count >= 1),
  CONSTRAINT flood_risk_backtest_metrics_object
    CHECK (jsonb_typeof(metrics) = 'object'),
  CONSTRAINT flood_risk_backtest_checksum
    CHECK (artifact_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT flood_risk_backtest_status
    CHECK (status IN ('CANDIDATE', 'VALIDATED', 'REJECTED'))
);

CREATE OR REPLACE FUNCTION protect_validated_flood_probability_calibration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.validated_at IS NOT NULL AND (
    NEW.public_id IS DISTINCT FROM OLD.public_id
    OR NEW.version IS DISTINCT FROM OLD.version
    OR NEW.model_version IS DISTINCT FROM OLD.model_version
    OR NEW.event_definition IS DISTINCT FROM OLD.event_definition
    OR NEW.validation_start IS DISTINCT FROM OLD.validation_start
    OR NEW.validation_end IS DISTINCT FROM OLD.validation_end
    OR NEW.sample_count IS DISTINCT FROM OLD.sample_count
    OR NEW.brier_score IS DISTINCT FROM OLD.brier_score
    OR NEW.artifact_checksum_sha256 IS DISTINCT FROM OLD.artifact_checksum_sha256
  ) THEN
    RAISE EXCEPTION 'validated flood-probability calibration scientific fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER flood_probability_calibrations_protect_validated
BEFORE UPDATE ON flood_probability_calibrations
FOR EACH ROW
EXECUTE FUNCTION protect_validated_flood_probability_calibration();
