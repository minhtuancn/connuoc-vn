CREATE TABLE admin_principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_principals_actor_id_nonempty CHECK (length(btrim(actor_id)) > 0),
  CONSTRAINT admin_principals_display_name_nonempty CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT admin_principals_role CHECK (role IN ('viewer', 'data-operator', 'administrator'))
);

CREATE TABLE admin_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL REFERENCES admin_principals(id) ON DELETE CASCADE,
  token_hash_sha256 char(64) NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_api_tokens_hash_format CHECK (token_hash_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT admin_api_tokens_label_nonempty CHECK (length(btrim(label)) > 0)
);

CREATE INDEX admin_api_tokens_principal_idx ON admin_api_tokens (principal_id);
CREATE INDEX admin_api_tokens_active_expiry_idx
  ON admin_api_tokens (is_active, expires_at)
  WHERE is_active = true;
