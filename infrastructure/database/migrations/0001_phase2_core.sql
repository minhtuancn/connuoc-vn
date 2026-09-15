CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  name text NOT NULL,
  source_type text NOT NULL,
  homepage_url text,
  license_code text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT data_sources_key_nonempty CHECK (length(btrim(source_key)) > 0),
  CONSTRAINT data_sources_name_nonempty CHECK (length(btrim(name)) > 0)
);

CREATE TABLE raw_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  payload_key text NOT NULL,
  checksum_sha256 char(64) NOT NULL,
  media_type text,
  byte_length bigint CHECK (byte_length IS NULL OR byte_length >= 0),
  storage_uri text,
  captured_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT raw_payloads_payload_key_nonempty CHECK (length(btrim(payload_key)) > 0),
  CONSTRAINT raw_payloads_checksum_sha256_format CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT raw_payloads_source_payload_key_unique UNIQUE (source_id, payload_key),
  CONSTRAINT raw_payloads_source_checksum_unique UNIQUE (source_id, checksum_sha256)
);

CREATE TABLE source_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  raw_payload_id uuid NOT NULL REFERENCES raw_payloads(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL UNIQUE,
  parser_version text NOT NULL,
  normalizer_version text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  accepted_records integer NOT NULL DEFAULT 0 CHECK (accepted_records >= 0),
  rejected_records integer NOT NULL DEFAULT 0 CHECK (rejected_records >= 0),
  error_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT source_import_runs_status CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'REJECTED')),
  CONSTRAINT source_import_runs_versions_nonempty CHECK (
    length(btrim(parser_version)) > 0 AND length(btrim(normalizer_version)) > 0
  )
);

CREATE TABLE basins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  name text NOT NULL,
  geometry geometry(MultiPolygon, 4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  basin_id uuid REFERENCES basins(id) ON DELETE SET NULL,
  name text NOT NULL,
  geometry geometry(MultiLineString, 4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE estuaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  river_id uuid REFERENCES rivers(id) ON DELETE SET NULL,
  name text NOT NULL,
  geometry geometry(Point, 4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  name text NOT NULL,
  station_type text NOT NULL,
  time_zone text NOT NULL,
  location geometry(Point, 4326) NOT NULL,
  river_id uuid REFERENCES rivers(id) ON DELETE SET NULL,
  estuary_id uuid REFERENCES estuaries(id) ON DELETE SET NULL,
  default_datum_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stations_public_id_nonempty CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT stations_timezone_nonempty CHECK (length(btrim(time_zone)) > 0)
);

CREATE TABLE station_aliases (
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (station_id, normalized_alias),
  CONSTRAINT station_aliases_nonempty CHECK (
    length(btrim(alias)) > 0 AND length(btrim(normalized_alias)) > 0
  )
);

CREATE TABLE observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  import_run_id uuid NOT NULL REFERENCES source_import_runs(id) ON DELETE RESTRICT,
  raw_payload_id uuid NOT NULL REFERENCES raw_payloads(id) ON DELETE RESTRICT,
  source_record_key text NOT NULL,
  observed_at timestamptz NOT NULL,
  value numeric(18, 6) NOT NULL,
  unit text NOT NULL,
  datum_id text,
  quality_state text NOT NULL DEFAULT 'UNKNOWN',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT observations_unit CHECK (unit IN ('m', 'cm', 'mm')),
  CONSTRAINT observations_quality_state CHECK (quality_state IN ('GOOD', 'SUSPECT', 'BAD', 'UNKNOWN')),
  CONSTRAINT observations_source_record_key_nonempty CHECK (length(btrim(source_record_key)) > 0),
  CONSTRAINT observations_source_record_unique UNIQUE (source_id, source_record_key)
);

CREATE TABLE forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
  source_id uuid REFERENCES data_sources(id) ON DELETE RESTRICT,
  import_run_id uuid REFERENCES source_import_runs(id) ON DELETE RESTRICT,
  model_id text NOT NULL,
  model_version text,
  generated_at timestamptz NOT NULL,
  horizon_start timestamptz NOT NULL,
  horizon_end timestamptz NOT NULL,
  unit text NOT NULL,
  datum_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forecast_runs_horizon_order CHECK (horizon_end >= horizon_start),
  CONSTRAINT forecast_runs_unit CHECK (unit IN ('m', 'cm', 'mm')),
  CONSTRAINT forecast_runs_model_id_nonempty CHECK (length(btrim(model_id)) > 0)
);

CREATE TABLE forecast_points (
  forecast_run_id uuid NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
  forecast_for timestamptz NOT NULL,
  value numeric(18, 6) NOT NULL,
  quality_state text NOT NULL DEFAULT 'UNKNOWN',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (forecast_run_id, forecast_for),
  CONSTRAINT forecast_points_quality_state CHECK (quality_state IN ('GOOD', 'SUSPECT', 'BAD', 'UNKNOWN'))
);

CREATE TABLE quality_flags (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_run_id uuid REFERENCES source_import_runs(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_key text NOT NULL,
  code text NOT NULL,
  severity text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quality_flags_severity CHECK (severity IN ('INFO', 'WARN', 'ERROR')),
  CONSTRAINT quality_flags_identity_nonempty CHECK (
    length(btrim(entity_type)) > 0 AND length(btrim(entity_key)) > 0 AND length(btrim(code)) > 0
  )
);

CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  correlation_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;

CREATE TRIGGER audit_log_append_only
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION reject_audit_log_mutation();

CREATE INDEX stations_location_gist_idx ON stations USING GIST (location);
CREATE INDEX basins_geometry_gist_idx ON basins USING GIST (geometry);
CREATE INDEX rivers_geometry_gist_idx ON rivers USING GIST (geometry);
CREATE INDEX estuaries_geometry_gist_idx ON estuaries USING GIST (geometry);
CREATE INDEX observations_station_observed_at_idx ON observations (station_id, observed_at DESC);
CREATE INDEX observations_import_run_idx ON observations (import_run_id);
CREATE INDEX observations_raw_payload_idx ON observations (raw_payload_id);
CREATE INDEX forecast_points_forecast_for_idx ON forecast_points (forecast_for);
CREATE INDEX source_import_runs_source_started_at_idx ON source_import_runs (source_id, started_at DESC);
CREATE INDEX quality_flags_import_run_idx ON quality_flags (import_run_id);
CREATE INDEX audit_log_occurred_at_idx ON audit_log (occurred_at DESC);
CREATE INDEX audit_log_target_idx ON audit_log (target_type, target_id, occurred_at DESC);
