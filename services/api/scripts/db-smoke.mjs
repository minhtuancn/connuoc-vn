import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for database smoke tests.');
}

const client = new Client({ connectionString: databaseUrl, application_name: 'connuoc-db-smoke' });
await client.connect();

async function expectConstraintViolation(name, operation) {
  await client.query(`SAVEPOINT ${name}`);
  let rejected = false;
  try {
    await operation();
  } catch (error) {
    rejected = error && typeof error === 'object' && 'code' in error && ['23505', '23514'].includes(error.code);
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }
  if (!rejected) {
    throw new Error(`Expected constraint violation for ${name}.`);
  }
}

try {
  const postgis = await client.query('SELECT PostGIS_Version() AS version');
  if (!postgis.rows[0]?.version) {
    throw new Error('PostGIS extension is not available after migrations.');
  }

  const expectedMigrations = [
    '0001_phase2_core.sql',
    '0002_tide_models.sql',
    '0003_admin_auth.sql',
    '0004_weather_provider_foundation.sql',
  ];
  const appliedMigrations = await client.query(
    'SELECT migration_name FROM schema_migrations ORDER BY migration_name ASC',
  );
  if (JSON.stringify(appliedMigrations.rows.map((row) => row.migration_name)) !== JSON.stringify(expectedMigrations)) {
    throw new Error('Expected migrations 0001 through 0004 to be applied in deterministic order.');
  }

  const expectedTables = [
    'data_sources',
    'raw_payloads',
    'source_import_runs',
    'stations',
    'observations',
    'forecast_runs',
    'forecast_points',
    'quality_flags',
    'audit_log',
    'tide_models',
    'tide_constituents',
    'admin_principals',
    'admin_api_tokens',
    'administrative_areas',
    'administrative_area_aliases',
    'administrative_area_successors',
    'provider_configs',
    'provider_capabilities',
    'provider_health_events',
  ];
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [expectedTables],
  );
  if (tables.rowCount !== expectedTables.length) {
    throw new Error(`Expected ${expectedTables.length} core tables, found ${tables.rowCount ?? 0}.`);
  }

  const forbiddenCredentialColumns = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'provider_configs'
       AND lower(column_name) = ANY($1::text[])`,
    [['api_key', 'apikey', 'token', 'password', 'secret_value']],
  );
  if ((forbiddenCredentialColumns.rowCount ?? 0) !== 0) {
    throw new Error('Provider config schema contains raw credential-like columns.');
  }

  await client.query('BEGIN');
  try {
    const source = await client.query(
      `INSERT INTO data_sources (source_key, name, source_type)
       VALUES ('ci-fixture', 'CI Fixture', 'fixture') RETURNING id`,
    );
    const sourceId = source.rows[0].id;

    const station = await client.query(
      `INSERT INTO stations (public_id, name, station_type, time_zone, location)
       VALUES (
         'ci-station',
         'CI Station',
         'water_level',
         'Asia/Ho_Chi_Minh',
         ST_SetSRID(ST_MakePoint(105.83, 21.03), 4326)
       ) RETURNING id`,
    );
    const stationId = station.rows[0].id;

    const nearby = await client.query(
      `SELECT public_id
       FROM stations
       WHERE id = $1
         AND ST_DWithin(
           location::geography,
           ST_SetSRID(ST_MakePoint(105.831, 21.031), 4326)::geography,
           500
         )`,
      [stationId],
    );
    if (nearby.rowCount !== 1 || nearby.rows[0].public_id !== 'ci-station') {
      throw new Error('PostGIS spatial proximity query did not return the fixture station.');
    }

    const province = await client.query(
      `INSERT INTO administrative_areas (
         public_id, official_code, name, normalized_name, area_kind,
         effective_from, is_current, geometry, geometry_source_id
       ) VALUES (
         'area:ci:province', '31', 'CI Province', 'ci province', 'PROVINCE',
         DATE '2025-07-01', true,
         ST_Multi(ST_GeomFromText('POLYGON((105 20,106 20,106 21,105 21,105 20))', 4326)),
         $1
       ) RETURNING id`,
      [sourceId],
    );
    const provinceId = province.rows[0].id;

    await expectConstraintViolation('historical_current', () => client.query(
      `INSERT INTO administrative_areas (
         public_id, official_code, name, normalized_name, area_kind, effective_from, is_current
       ) VALUES ('area:ci:legacy-district', 'LEGACY-1', 'Legacy District', 'legacy district',
         'HISTORICAL_DISTRICT', DATE '2020-01-01', true)`,
    ));

    await expectConstraintViolation('invalid_effective_range', () => client.query(
      `INSERT INTO administrative_areas (
         public_id, official_code, name, normalized_name, area_kind,
         effective_from, effective_to, is_current
       ) VALUES ('area:ci:invalid-range', 'BAD-RANGE', 'Bad Range', 'bad range', 'COMMUNE',
         DATE '2026-09-18', DATE '2026-09-17', false)`,
    ));

    await expectConstraintViolation('self_parent', () => client.query(
      'UPDATE administrative_areas SET parent_id = id WHERE id = $1',
      [provinceId],
    ));

    await expectConstraintViolation('duplicate_current_official_code', () => client.query(
      `INSERT INTO administrative_areas (
         public_id, official_code, name, normalized_name, area_kind, effective_from, is_current
       ) VALUES ('area:ci:duplicate-code', '31', 'Duplicate Code', 'duplicate code', 'PROVINCE',
         DATE '2025-07-01', true)`,
    ));

    const provider = await client.query(
      `INSERT INTO provider_configs (
         provider_key, data_source_id, provider_type, enabled, priority, weight,
         commercial_use_status, redistribution_status, licence_status, health_state,
         health_blocks_selection, secret_ref
       ) VALUES (
         'ci-weather', $1, 'fixture', true, 100, 1,
         'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED', 'HEALTHY', false,
         'secret://ci/weather'
       ) RETURNING id`,
      [sourceId],
    );
    const providerId = provider.rows[0].id;

    await client.query(
      `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
       VALUES ($1, 'weather.current', true)`,
      [providerId],
    );
    await client.query(
      `INSERT INTO provider_health_events (provider_config_id, state, latency_ms)
       VALUES ($1, 'HEALTHY', 25)`,
      [providerId],
    );

    await expectConstraintViolation('empty_provider_key', () => client.query(
      `INSERT INTO provider_configs (
         provider_key, provider_type, commercial_use_status, redistribution_status,
         licence_status, health_state
       ) VALUES ('   ', 'fixture', 'ALLOWED', 'ALLOWED', 'REVIEWED', 'HEALTHY')`,
    ));

    await expectConstraintViolation('invalid_provider_status', () => client.query(
      `INSERT INTO provider_configs (
         provider_key, provider_type, commercial_use_status, redistribution_status,
         licence_status, health_state
       ) VALUES ('ci-invalid-status', 'fixture', 'MAYBE', 'ALLOWED', 'REVIEWED', 'HEALTHY')`,
    ));

    const tideModel = await client.query(
      `INSERT INTO tide_models (
         station_id, source_id, model_id, model_version, datum_id, unit,
         mean_level, reference_epoch, phase_convention
       )
       VALUES ($1, $2, 'ci-harmonic', '1.0.0', 'ci-datum', 'm', 0.5,
         '2026-01-01T00:00:00Z', 'cosine_lag_degrees')
       RETURNING id`,
      [stationId, sourceId],
    );
    const tideModelId = tideModel.rows[0].id;
    await client.query(
      `INSERT INTO tide_constituents (
         tide_model_id, name, amplitude, phase_degrees, speed_degrees_per_hour, ordinal
       ) VALUES
         ($1, 'M2', 0.8, 20, 28.9841042, 0),
         ($1, 'S2', 0.2, 45, 30.0, 1)`,
      [tideModelId],
    );
    const constituentCount = await client.query(
      `SELECT count(*)::int AS count FROM tide_constituents WHERE tide_model_id = $1`,
      [tideModelId],
    );
    if (constituentCount.rows[0]?.count !== 2) {
      throw new Error('Harmonic tide model constituents were not persisted deterministically.');
    }

    const principal = await client.query(
      `INSERT INTO admin_principals (actor_id, display_name, role)
       VALUES ('ci-operator', 'CI Operator', 'data-operator') RETURNING id`,
    );
    const principalId = principal.rows[0].id;
    const tokenHash = 'c'.repeat(64);
    await client.query(
      `INSERT INTO admin_api_tokens (principal_id, token_hash_sha256, label)
       VALUES ($1, $2, 'ci-runtime-only')`,
      [principalId, tokenHash],
    );
    const tokenLookup = await client.query(
      `SELECT p.actor_id, p.role
       FROM admin_api_tokens t
       JOIN admin_principals p ON p.id = t.principal_id
       WHERE t.token_hash_sha256 = $1 AND t.is_active AND p.is_active`,
      [tokenHash],
    );
    if (tokenLookup.rows[0]?.actor_id !== 'ci-operator' || tokenLookup.rows[0]?.role !== 'data-operator') {
      throw new Error('Admin token hash did not resolve to the expected active principal.');
    }

    const checksum = 'a'.repeat(64);
    await client.query(
      `INSERT INTO raw_payloads
        (source_id, payload_key, checksum_sha256, captured_at, byte_length)
       VALUES ($1, 'fixture:2026-09-15', $2, now(), 128)`,
      [sourceId, checksum],
    );

    await client.query('SAVEPOINT duplicate_payload');
    let duplicateRejected = false;
    try {
      await client.query(
        `INSERT INTO raw_payloads
          (source_id, payload_key, checksum_sha256, captured_at, byte_length)
         VALUES ($1, 'fixture:2026-09-15-duplicate-key', $2, now(), 128)`,
        [sourceId, checksum],
      );
    } catch (error) {
      duplicateRejected = error && typeof error === 'object' && 'code' in error && error.code === '23505';
      await client.query('ROLLBACK TO SAVEPOINT duplicate_payload');
    }
    if (!duplicateRejected) {
      throw new Error('Raw payload checksum uniqueness did not reject duplicate source content.');
    }

    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  console.log(JSON.stringify({
    status: 'ok',
    postgisVersion: postgis.rows[0].version,
    checkedTables: expectedTables.length,
    checks: [
      'migration-order-0001-through-0004',
      'spatial-query',
      'administrative-area-constraints',
      'provider-policy-schema',
      'provider-secret-column-redaction',
      'harmonic-tide-model-schema',
      'admin-token-hash-schema',
      'raw-payload-idempotency-constraint',
    ],
  }));
} finally {
  await client.end();
}
