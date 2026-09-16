CREATE TABLE administrative_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  official_code text NOT NULL,
  name text NOT NULL,
  normalized_name text NOT NULL,
  area_kind text NOT NULL,
  parent_id uuid REFERENCES administrative_areas(id) ON DELETE RESTRICT,
  effective_from date NOT NULL,
  effective_to date,
  is_current boolean NOT NULL DEFAULT false,
  geometry geometry(MultiPolygon, 4326),
  geometry_source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT administrative_areas_public_id_nonempty CHECK (length(btrim(public_id)) > 0),
  CONSTRAINT administrative_areas_official_code_nonempty CHECK (length(btrim(official_code)) > 0),
  CONSTRAINT administrative_areas_name_nonempty CHECK (length(btrim(name)) > 0),
  CONSTRAINT administrative_areas_normalized_name_nonempty CHECK (length(btrim(normalized_name)) > 0),
  CONSTRAINT administrative_areas_kind CHECK (
    area_kind IN ('PROVINCE', 'CENTRAL_CITY', 'COMMUNE', 'WARD', 'SPECIAL_ZONE', 'HISTORICAL_DISTRICT')
  ),
  CONSTRAINT administrative_areas_effective_range CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT administrative_areas_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id),
  CONSTRAINT administrative_areas_historical_not_current CHECK (
    area_kind <> 'HISTORICAL_DISTRICT' OR is_current = false
  ),
  CONSTRAINT administrative_areas_current_open_ended CHECK (
    is_current = false OR effective_to IS NULL
  )
);

CREATE UNIQUE INDEX administrative_areas_current_official_code_uniq
  ON administrative_areas (official_code)
  WHERE is_current = true;
CREATE INDEX administrative_areas_current_name_idx
  ON administrative_areas (normalized_name, area_kind)
  WHERE is_current = true;
CREATE INDEX administrative_areas_parent_idx ON administrative_areas (parent_id);
CREATE INDEX administrative_areas_effective_idx
  ON administrative_areas (effective_from, effective_to);
CREATE INDEX administrative_areas_current_geometry_gist_idx
  ON administrative_areas USING GIST (geometry)
  WHERE is_current = true AND geometry IS NOT NULL;

CREATE TABLE administrative_area_aliases (
  area_id uuid NOT NULL REFERENCES administrative_areas(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  alias_kind text NOT NULL,
  effective_from date,
  effective_to date,
  source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (area_id, normalized_alias, alias_kind),
  CONSTRAINT administrative_area_aliases_alias_nonempty CHECK (length(btrim(alias)) > 0),
  CONSTRAINT administrative_area_aliases_normalized_nonempty CHECK (length(btrim(normalized_alias)) > 0),
  CONSTRAINT administrative_area_aliases_kind CHECK (
    alias_kind IN ('CURRENT_NAME', 'HISTORICAL_NAME', 'LEGACY_DISTRICT', 'OTHER')
  ),
  CONSTRAINT administrative_area_aliases_effective_range CHECK (
    effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
  )
);
CREATE INDEX administrative_area_aliases_normalized_idx
  ON administrative_area_aliases (normalized_alias, alias_kind);

CREATE TABLE administrative_area_successors (
  predecessor_area_id uuid NOT NULL REFERENCES administrative_areas(id) ON DELETE CASCADE,
  successor_area_id uuid NOT NULL REFERENCES administrative_areas(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  effective_at date NOT NULL,
  source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (predecessor_area_id, successor_area_id, relationship),
  CONSTRAINT administrative_area_successors_distinct CHECK (predecessor_area_id <> successor_area_id),
  CONSTRAINT administrative_area_successors_relationship CHECK (
    relationship IN ('MERGED_INTO', 'SPLIT_TO', 'RENAMED_TO', 'REORGANIZED_TO')
  )
);
CREATE INDEX administrative_area_successors_successor_idx
  ON administrative_area_successors (successor_area_id, effective_at);

CREATE TABLE provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  data_source_id uuid REFERENCES data_sources(id) ON DELETE SET NULL,
  provider_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  weight numeric(12, 6) NOT NULL DEFAULT 1,
  secret_ref text,
  endpoint_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  commercial_use_status text NOT NULL DEFAULT 'UNKNOWN',
  redistribution_status text NOT NULL DEFAULT 'UNKNOWN',
  licence_status text NOT NULL DEFAULT 'UNKNOWN',
  attribution_text text,
  attribution_url text,
  coverage geometry(MultiPolygon, 4326),
  quota_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  budget_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  freshness_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_allow_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  fallback_group text,
  health_state text NOT NULL DEFAULT 'UNKNOWN',
  health_blocks_selection boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_configs_key_nonempty CHECK (length(btrim(provider_key)) > 0),
  CONSTRAINT provider_configs_type_nonempty CHECK (length(btrim(provider_type)) > 0),
  CONSTRAINT provider_configs_priority_nonnegative CHECK (priority >= 0),
  CONSTRAINT provider_configs_weight_nonnegative CHECK (weight >= 0),
  CONSTRAINT provider_configs_secret_ref_nonempty CHECK (secret_ref IS NULL OR length(btrim(secret_ref)) > 0),
  CONSTRAINT provider_configs_commercial_use_status CHECK (
    commercial_use_status IN ('ALLOWED', 'RESTRICTED', 'UNKNOWN')
  ),
  CONSTRAINT provider_configs_redistribution_status CHECK (
    redistribution_status IN ('ALLOWED', 'RESTRICTED', 'ATTRIBUTION_REQUIRED', 'UNKNOWN')
  ),
  CONSTRAINT provider_configs_licence_status_nonempty CHECK (length(btrim(licence_status)) > 0),
  CONSTRAINT provider_configs_health_state CHECK (
    health_state IN ('HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN')
  )
);
CREATE INDEX provider_configs_enabled_priority_idx
  ON provider_configs (enabled, priority DESC, weight DESC, provider_key);
CREATE INDEX provider_configs_fallback_group_idx ON provider_configs (fallback_group);
CREATE INDEX provider_configs_coverage_gist_idx
  ON provider_configs USING GIST (coverage)
  WHERE coverage IS NOT NULL;

CREATE TABLE provider_capabilities (
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE CASCADE,
  capability text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_config_id, capability),
  CONSTRAINT provider_capabilities_capability_nonempty CHECK (length(btrim(capability)) > 0)
);
CREATE INDEX provider_capabilities_lookup_idx
  ON provider_capabilities (capability, enabled, provider_config_id);

CREATE TABLE provider_health_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  state text NOT NULL,
  latency_ms integer,
  failure_code text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT provider_health_events_state CHECK (
    state IN ('HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN')
  ),
  CONSTRAINT provider_health_events_latency_nonnegative CHECK (latency_ms IS NULL OR latency_ms >= 0)
);
CREATE INDEX provider_health_events_provider_time_idx
  ON provider_health_events (provider_config_id, occurred_at DESC);
