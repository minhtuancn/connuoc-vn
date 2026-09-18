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
    '0005_weather_forecasts.sql',
    '0006_rainfall.sql',
    '0007_hydrology_discharge.sql',
    '0008_stage_calibration.sql',
    '0009_flood_risk.sql',
  ];
  const appliedMigrations = await client.query(
    'SELECT migration_name FROM schema_migrations ORDER BY migration_name ASC',
  );
  if (JSON.stringify(appliedMigrations.rows.map((row) => row.migration_name)) !== JSON.stringify(expectedMigrations)) {
    throw new Error('Expected migrations 0001 through 0009 to be applied in deterministic order.');
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
    'weather_forecast_runs',
    'weather_current_points',
    'weather_hourly_points',
    'weather_daily_points',
    'rainfall_runs',
    'rainfall_records',
    'rainfall_accumulations',
    'river_reaches',
    'river_reach_provider_mappings',
    'hydrology_forecast_runs',
    'hydrology_discharge_points',
    'hydrology_return_periods',
    'gauge_reach_links',
    'calibration_runs',
    'calibration_metric_breakdowns',
    'rating_curves',
    'rating_curve_points',
    'stage_forecast_runs',
    'stage_forecast_points',
    'flood_susceptibility_baselines',
    'flood_probability_calibrations',
    'flood_risk_assessments',
    'flood_risk_backtest_runs',
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

  const weatherColumns = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'weather_forecast_runs'`,
  );
  const weatherColumnNames = new Set(weatherColumns.rows.map((row) => row.column_name));
  for (const forbidden of ['request_latitude', 'request_longitude', 'user_latitude', 'user_longitude']) {
    if (weatherColumnNames.has(forbidden)) {
      throw new Error(`Weather history schema must not persist exact request coordinate column ${forbidden}.`);
    }
  }
  for (const required of ['provider_grid', 'normalized_checksum', 'stale_after', 'source_registry_id']) {
    if (!weatherColumnNames.has(required)) {
      throw new Error(`Weather history schema is missing ${required}.`);
    }
  }

  const rainfallColumns = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'rainfall_runs'`,
  );
  const rainfallColumnNames = new Set(rainfallColumns.rows.map((row) => row.column_name));
  for (const forbidden of ['request_latitude', 'request_longitude', 'user_latitude', 'user_longitude']) {
    if (rainfallColumnNames.has(forbidden)) {
      throw new Error(`Rainfall history schema must not persist exact request coordinate column ${forbidden}.`);
    }
  }
  for (const required of ['spatial_point', 'normalized_checksum', 'stale_after', 'source_registry_id', 'object_uris']) {
    if (!rainfallColumnNames.has(required)) {
      throw new Error(`Rainfall history schema is missing ${required}.`);
    }
  }

  const hydrologyTables = [
    'river_reaches',
    'river_reach_provider_mappings',
    'hydrology_forecast_runs',
    'hydrology_discharge_points',
    'hydrology_return_periods',
  ];
  const hydrologyColumns = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [hydrologyTables],
  );
  const forbiddenHydrologyColumns = new Set([
    'request_latitude',
    'request_longitude',
    'user_latitude',
    'user_longitude',
    'stage',
    'stage_m',
    'water_level',
    'water_level_m',
    'datum_id',
  ]);
  for (const row of hydrologyColumns.rows) {
    if (forbiddenHydrologyColumns.has(row.column_name)) {
      throw new Error(
        `Phase 5D hydrology schema must not contain stage/request-history column ${row.table_name}.${row.column_name}.`,
      );
    }
  }
  const dischargePointColumns = new Set(
    hydrologyColumns.rows
      .filter((row) => row.table_name === 'hydrology_discharge_points')
      .map((row) => row.column_name),
  );
  for (const required of [
    'product_kind',
    'valid_at',
    'lead_seconds',
    'discharge_cms',
    'unit',
    'ensemble_member',
    'statistic',
  ]) {
    if (!dischargePointColumns.has(required)) {
      throw new Error(`Hydrology discharge schema is missing ${required}.`);
    }
  }


  const calibrationColumns = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [[
      'calibration_runs',
      'rating_curves',
      'stage_forecast_runs',
      'stage_forecast_points',
    ]],
  );
  const calibrationColumnMap = new Map();
  for (const row of calibrationColumns.rows) {
    const values = calibrationColumnMap.get(row.table_name) ?? new Set();
    values.add(row.column_name);
    calibrationColumnMap.set(row.table_name, values);
  }
  for (const [table, required] of Object.entries({
    calibration_runs: [
      'datum_id',
      'test_mae_m',
      'test_rmse_m',
      'accepted_test_rmse_m',
      'artifact_checksum_sha256',
      'deployment_status',
    ],
    rating_curves: [
      'datum_id',
      'valid_discharge_min_cms',
      'valid_discharge_max_cms',
      'extrapolation_policy',
      'curve_checksum_sha256',
      'status',
    ],
    stage_forecast_runs: [
      'datum_id',
      'evidence_status',
      'test_mae_m',
      'test_rmse_m',
      'normalized_checksum',
    ],
    stage_forecast_points: [
      'lead_seconds',
      'discharge_cms',
      'derivation_status',
      'stage_m',
      'datum_id',
      'extrapolated',
    ],
  })) {
    const actual = calibrationColumnMap.get(table) ?? new Set();
    for (const column of required) {
      if (!actual.has(column)) {
        throw new Error(`Stage calibration schema is missing ${table}.${column}.`);
      }
    }
  }


  const floodRiskColumns = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [[
      'flood_probability_calibrations',
      'flood_risk_assessments',
      'flood_risk_backtest_runs',
    ]],
  );
  const floodRiskColumnMap = new Map();
  for (const row of floodRiskColumns.rows) {
    const values = floodRiskColumnMap.get(row.table_name) ?? new Set();
    values.add(row.column_name);
    floodRiskColumnMap.set(row.table_name, values);
  }
  for (const [table, required] of Object.entries({
    flood_susceptibility_baselines: [
      'source_id',
      'version',
      'level',
      'resolution_m',
      'geometry',
      'limitation',
    ],
    flood_probability_calibrations: [
      'event_definition',
      'validation_start',
      'validation_end',
      'sample_count',
      'brier_score',
      'artifact_checksum_sha256',
      'status',
    ],
    flood_risk_assessments: [
      'scope_kind',
      'scope_public_id',
      'risk_level',
      'confidence',
      'model_version',
      'probability_min',
      'probability_max',
      'probability_calibration_id',
      'input_checksum_sha256',
    ],
    flood_risk_backtest_runs: [
      'event_definition',
      'evaluation_start',
      'evaluation_end',
      'metrics',
      'artifact_checksum_sha256',
      'status',
    ],
  })) {
    const actual = floodRiskColumnMap.get(table) ?? new Set();
    for (const column of required) {
      if (!actual.has(column)) {
        throw new Error(`Flood-risk schema is missing ${table}.${column}.`);
      }
    }
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

    const rainfallRun = await client.query(
      `INSERT INTO rainfall_runs (
         provider_config_id, source_registry_id, capability, spatial_point,
         spatial_representation, resolution_km, product_id, product_version,
         fetched_at, stale_after, attribution_text, normalized_checksum
       ) VALUES (
         $1, 'ci-rain-source', 'rainfall.satellite',
         ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326)::geography,
         'GRID_CELL', 10, 'ci-rain-product', '1',
         '2026-09-17T02:00:00Z', '2026-09-17T03:00:00Z',
         'CI rainfall fixture', $2
       ) RETURNING id`,
      [providerId, 'd'.repeat(64)],
    );
    const rainfallRunId = rainfallRun.rows[0].id;

    await expectConstraintViolation('unsupported_rainfall_window', () => client.query(
      `INSERT INTO rainfall_accumulations (
         rainfall_run_id, end_at, window_seconds, amount_mm, coverage_ratio,
         complete, derivation_version, input_record_ids, source_ids
       ) VALUES (
         $1, '2026-09-17T03:00:00Z', 7200, 4, 1,
         true, 'rainfall-accum-v1', ARRAY['r1'], ARRAY['ci-rain-source']
       )`,
      [rainfallRunId],
    ));

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
      'migration-order-0001-through-0009',
      'spatial-query',
      'administrative-area-constraints',
      'provider-policy-schema',
      'provider-secret-column-redaction',
      'weather-forecast-history-schema',
      'weather-request-coordinate-non-persistence',
      'rainfall-history-schema',
      'rainfall-request-coordinate-non-persistence',
      'rainfall-supported-window-constraint',
      'hydrology-discharge-only-schema',
      'hydrology-request-coordinate-non-persistence',
      'stage-calibration-schema',
      'stage-datum-and-evidence-columns',
      'flood-risk-schema',
      'flood-probability-calibration-gate',
      'harmonic-tide-model-schema',
      'admin-token-hash-schema',
      'raw-payload-idempotency-constraint',
    ],
  }));
} finally {
  await client.end();
}
