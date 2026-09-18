import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for hydrology schema integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'hydrology-schema-integration',
});

let client: PoolClient;
let providerId: string;
let reachId: string;

beforeAll(async () => {
  client = await pool.connect();
  await client.query('BEGIN');

  const source = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('hydrology-schema-fixture', 'Hydrology schema fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await client.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:hydrology:test', 'Hydrology Test Basin')
     RETURNING id`,
  );

  const river = await client.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:hydrology:test',
       $1,
       'Hydrology Test River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.4 19.4,105.6 19.6)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const provider = await client.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, health_state, health_blocks_selection
     ) VALUES (
       'hydrology-schema-provider', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED',
       'Hydrology schema fixture', 'HEALTHY', false
     )
     RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  const reach = await client.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:hydrology:test:001',
       $1,
       $2,
       'Hydrology Test Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.45 19.45,105.55 19.55)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );
  reachId = reach.rows[0]!.id;
});

afterAll(async () => {
  if (client) {
    await client.query('ROLLBACK');
    client.release();
  }
  await pool.end();
});

describe('Phase 5D hydrology schema', () => {
  it('adds reach/mapping/discharge tables without request-coordinate or stage columns', async () => {
    const expected = [
      'river_reaches',
      'river_reach_provider_mappings',
      'hydrology_forecast_runs',
      'hydrology_discharge_points',
      'hydrology_return_periods',
    ];

    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])
       ORDER BY table_name`,
      [expected],
    );
    expect(tables.rows.map((row) => row.table_name).sort()).toEqual(expected.sort());

    const columns = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [expected],
    );

    const forbidden = new Set([
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
    for (const column of columns.rows) {
      expect(forbidden.has(column.column_name)).toBe(false);
    }
  });

  it('persists explicit provider reach mapping confidence and method', async () => {
    const inserted = await client.query<{
      mapping_state: string;
      mapping_method: string;
      confidence: string;
      provider_reach_id: string;
    }>(
      `INSERT INTO river_reach_provider_mappings (
         river_reach_id, provider_config_id, provider_reach_id,
         provider_product_id, provider_product_version,
         mapping_state, mapping_method, confidence, distance_km
       ) VALUES (
         $1, $2, '123456', 'geoglows-v2', '2',
         'MAPPED', 'PROVIDER_ID', 1, 0
       )
       RETURNING mapping_state, mapping_method, confidence, provider_reach_id`,
      [reachId, providerId],
    );

    expect(inserted.rows[0]).toMatchObject({
      mapping_state: 'MAPPED',
      mapping_method: 'PROVIDER_ID',
      provider_reach_id: '123456',
    });
    expect(Number(inserted.rows[0]!.confidence)).toBe(1);
  });

  it('stores forecast member/statistic metadata and return-period reference discharge', async () => {
    const run = await client.query<{ id: string }>(
      `INSERT INTO hydrology_forecast_runs (
         provider_config_id, river_reach_id, source_registry_id, capability,
         provider_reach_id, product_id, product_version, model_run_at,
         fetched_at, stale_after, attribution_text, normalized_checksum
       ) VALUES (
         $1, $2, 'geoglows-ecmwf-streamflow', 'hydrology.dischargeForecast',
         '123456', 'geoglows-v2-forecast', '2',
         '2026-09-18T00:00:00Z', '2026-09-18T00:05:00Z',
         '2026-09-18T06:05:00Z', 'GEOGLOWS ECMWF Streamflow Service',
         $3
       )
       RETURNING id`,
      [providerId, reachId, 'a'.repeat(64)],
    );

    const runId = run.rows[0]!.id;

    await client.query(
      `INSERT INTO hydrology_discharge_points (
         hydrology_run_id, external_record_id, product_kind, valid_at,
         lead_seconds, discharge_cms, unit, ensemble_member, statistic,
         quality_state, quality_flags
       ) VALUES
         ($1, 'mean-6h', 'FORECAST_MEAN', '2026-09-18T06:00:00Z',
          21600, 523.4, 'm3/s', NULL, 'MEAN', 'ESTIMATED', ARRAY[]::text[]),
         ($1, 'member-7-6h', 'FORECAST_ENSEMBLE_MEMBER', '2026-09-18T06:00:00Z',
          21600, 551.2, 'm3/s', 7, NULL, 'ESTIMATED', ARRAY['ENSEMBLE'])`,
      [runId],
    );

    await client.query(
      `INSERT INTO hydrology_return_periods (
         hydrology_run_id, return_period_years, discharge_cms, unit,
         retrospective_period_start, retrospective_period_end
       ) VALUES (
         $1, 20, 2350, 'm3/s',
         '1980-01-01T00:00:00Z', '2025-12-31T00:00:00Z'
       )`,
      [runId],
    );

    const points = await client.query<{
      product_kind: string;
      ensemble_member: number | null;
      statistic: string | null;
    }>(
      `SELECT product_kind, ensemble_member, statistic
       FROM hydrology_discharge_points
       WHERE hydrology_run_id = $1
       ORDER BY external_record_id`,
      [runId],
    );
    expect(points.rows).toEqual([
      {
        product_kind: 'FORECAST_ENSEMBLE_MEMBER',
        ensemble_member: 7,
        statistic: null,
      },
      {
        product_kind: 'FORECAST_MEAN',
        ensemble_member: null,
        statistic: 'MEAN',
      },
    ]);

    const returnPeriod = await client.query<{ discharge_cms: string }>(
      `SELECT discharge_cms
       FROM hydrology_return_periods
       WHERE hydrology_run_id = $1 AND return_period_years = 20`,
      [runId],
    );
    expect(Number(returnPeriod.rows[0]!.discharge_cms)).toBe(2350);
  });

  it('enforces run idempotency and discharge-only constraints', async () => {
    const insertRun = () =>
      client.query(
        `INSERT INTO hydrology_forecast_runs (
           provider_config_id, river_reach_id, source_registry_id, capability,
           provider_reach_id, product_id, model_run_at, fetched_at, stale_after,
           attribution_text, normalized_checksum
         ) VALUES (
           $1, $2, 'geoglows-ecmwf-streamflow', 'hydrology.dischargeForecast',
           '123456', 'geoglows-v2-forecast', '2026-09-18T00:00:00Z',
           '2026-09-18T00:05:00Z', '2026-09-18T06:05:00Z',
           'GEOGLOWS ECMWF Streamflow Service', $3
         )`,
        [providerId, reachId, 'b'.repeat(64)],
      );

    await insertRun();

    await client.query('SAVEPOINT duplicate_hydrology_run');
    await expect(insertRun()).rejects.toMatchObject({ code: '23505' });
    await client.query('ROLLBACK TO SAVEPOINT duplicate_hydrology_run');

    const run = await client.query<{ id: string }>(
      `SELECT id
       FROM hydrology_forecast_runs
       WHERE provider_config_id = $1 AND normalized_checksum = $2`,
      [providerId, 'b'.repeat(64)],
    );

    await client.query('SAVEPOINT negative_hydrology_discharge');
    await expect(
      client.query(
        `INSERT INTO hydrology_discharge_points (
           hydrology_run_id, external_record_id, product_kind, valid_at,
           lead_seconds, discharge_cms, unit, statistic,
           quality_state, quality_flags
         ) VALUES (
           $1, 'negative', 'FORECAST_MEAN', '2026-09-18T06:00:00Z',
           21600, -1, 'm3/s', 'MEAN', 'ESTIMATED', ARRAY[]::text[]
         )`,
        [run.rows[0]!.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await client.query('ROLLBACK TO SAVEPOINT negative_hydrology_discharge');
  });
});
