CREATE TABLE tide_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  source_id uuid REFERENCES data_sources(id) ON DELETE RESTRICT,
  import_run_id uuid REFERENCES source_import_runs(id) ON DELETE RESTRICT,
  model_id text NOT NULL,
  model_version text,
  datum_id text NOT NULL,
  unit text NOT NULL,
  mean_level numeric(18, 6) NOT NULL,
  reference_epoch timestamptz NOT NULL,
  phase_convention text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tide_models_model_id_nonempty CHECK (length(btrim(model_id)) > 0),
  CONSTRAINT tide_models_model_version_nonempty CHECK (
    model_version IS NULL OR length(btrim(model_version)) > 0
  ),
  CONSTRAINT tide_models_datum_id_nonempty CHECK (length(btrim(datum_id)) > 0),
  CONSTRAINT tide_models_unit CHECK (unit IN ('m', 'cm', 'mm')),
  CONSTRAINT tide_models_phase_convention CHECK (
    phase_convention IN ('cosine_lag_degrees', 'cosine_lead_degrees')
  )
);

CREATE UNIQUE INDEX tide_models_identity_unique_idx
  ON tide_models (station_id, model_id, COALESCE(model_version, ''));

CREATE INDEX tide_models_station_active_idx
  ON tide_models (station_id, is_active, updated_at DESC);

CREATE TABLE tide_constituents (
  tide_model_id uuid NOT NULL REFERENCES tide_models(id) ON DELETE CASCADE,
  name text NOT NULL,
  amplitude numeric(18, 9) NOT NULL,
  phase_degrees numeric(12, 8) NOT NULL,
  speed_degrees_per_hour numeric(12, 8) NOT NULL,
  ordinal integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tide_model_id, name),
  CONSTRAINT tide_constituents_name_nonempty CHECK (length(btrim(name)) > 0),
  CONSTRAINT tide_constituents_amplitude_nonnegative CHECK (amplitude >= 0),
  CONSTRAINT tide_constituents_phase_range CHECK (phase_degrees >= 0 AND phase_degrees < 360),
  CONSTRAINT tide_constituents_speed_positive CHECK (speed_degrees_per_hour > 0),
  CONSTRAINT tide_constituents_ordinal_nonnegative CHECK (ordinal >= 0),
  CONSTRAINT tide_constituents_model_ordinal_unique UNIQUE (tide_model_id, ordinal)
);

CREATE INDEX tide_constituents_model_ordinal_idx
  ON tide_constituents (tide_model_id, ordinal);
