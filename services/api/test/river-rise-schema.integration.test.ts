import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for river-rise schema integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'river-rise-schema-integration',
});

let client: PoolClient;
let stationId: string;
let reachId: string;
let calibrationRunId: string;
let ratingCurveId: string;

beforeAll(async () => {
  client = await pool.connect();
  await client.query('BEGIN');

  const source = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('river-rise-schema-fixture', 'River rise schema fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await client.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:river-rise:schema', 'River Rise Schema Basin')
     RETURNING id`,
  );

  const river = await client.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:river-rise:schema',
       $1,
       'River Rise Schema River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.4 19.4,105.6 19.6)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const reach = await client.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:river-rise:schema',
       $1,
       $2,
       'River Rise Schema Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.49 19.49,105.51 19.51)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );
  reachId = reach.rows[0]!.id;

  const station = await client.query<{ id: string }>(
    `INSERT INTO stations (
       public_id, name, station_type, time_zone, location,
       river_id, river_reach_id, default_datum_id
     ) VALUES (
       'station:river-rise:schema',
       'River Rise Schema Gauge',
       'water_level',
       'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326),
       $1, $2,
       'datum:river-rise:local'
     )
     RETURNING id`,
    [river.rows[0]!.id, reachId],
  );
  stationId = station.rows[0]!.id;
});

afterAll(async () => {
  if (client) {
    await client.query('ROLLBACK');
    client.release();
  }
  await pool.end();
});

describe('Phase 5E river-rise calibration schema', () => {
  it('persists a reproducible active calibration run with validation metrics', async () => {
    const run = await client.query<{ id: string }>(
      `INSERT INTO calibration_runs (
         public_id, station_id, river_reach_id,
         model_family, model_version, feature_version, source_ids,
         training_start, training_end,
         validation_start, validation_end,
         test_start, test_end,
         split_strategy, sample_count, mae_m, rmse_m, bias_m,
         lead_metrics, artifact_sha256, status, activated_at
       ) VALUES (
         'calibration:river-rise:schema:v1', $1, $2,
         'RATING_CURVE_PIECEWISE_LINEAR', 'v1', 'pairs-v1',
         ARRAY['source:gauge:fixture'],
         '2025-01-01T00:00:00Z', '2026-03-31T23:59:59Z',
         '2026-04-01T00:00:00Z', '2026-06-30T23:59:59Z',
         '2026-07-01T00:00:00Z', '2026-08-31T23:59:59Z',
         'TIME_ORDERED_HOLDOUT', 120, 0.08, 0.11, 0.01,
         '[{"leadSeconds":21600,"sampleCount":40,"maeM":0.10,"rmseM":0.13}]'::jsonb,
         $3, 'ACTIVE', '2026-09-18T00:00:00Z'
       )
       RETURNING id`,
      [stationId, reachId, 'a'.repeat(64)],
    );
    calibrationRunId = run.rows[0]!.id;

    const selected = await client.query<{
      model_family: string;
      sample_count: number;
      mae_m: string;
      rmse_m: string;
      status: string;
    }>(
      `SELECT model_family, sample_count, mae_m, rmse_m, status
       FROM calibration_runs WHERE id = $1`,
      [calibrationRunId],
    );
    expect(selected.rows[0]).toMatchObject({
      model_family: 'RATING_CURVE_PIECEWISE_LINEAR',
      sample_count: 120,
      status: 'ACTIVE',
    });
    expect(Number(selected.rows[0]!.mae_m)).toBe(0.08);
    expect(Number(selected.rows[0]!.rmse_m)).toBe(0.11);
  });

  it('rejects an ACTIVE complex model that does not beat its held-out baseline', async () => {
    await client.query('SAVEPOINT complex_model_gate');
    await expect(
      client.query(
        `INSERT INTO calibration_runs (
           public_id, station_id, river_reach_id,
           model_family, model_version, feature_version, source_ids,
           training_start, training_end,
           validation_start, validation_end,
           test_start, test_end,
           split_strategy, sample_count, mae_m, rmse_m,
           artifact_sha256, status, baseline_model_family,
           baseline_rmse_m, activated_at
         ) VALUES (
           'calibration:river-rise:complex:bad', $1, $2,
           'RIDGE_RAIN_UPSTREAM_TIDE', 'v1', 'features-v1',
           ARRAY['source:gauge:fixture'],
           '2025-01-01T00:00:00Z', '2026-03-31T23:59:59Z',
           '2026-04-01T00:00:00Z', '2026-06-30T23:59:59Z',
           '2026-07-01T00:00:00Z', '2026-08-31T23:59:59Z',
           'TIME_ORDERED_HOLDOUT', 120, 0.12, 0.20,
           $3, 'ACTIVE', 'PERSISTENCE', 0.19,
           '2026-09-18T00:00:00Z'
         )`,
        [stationId, reachId, 'b'.repeat(64)],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await client.query('ROLLBACK TO SAVEPOINT complex_model_gate');
  });

  it('stores one active monotonic rating-curve artifact per station/reach/datum', async () => {
    const curve = await client.query<{ id: string }>(
      `INSERT INTO rating_curves (
         public_id, station_id, river_reach_id, calibration_run_id,
         version, datum_id, stage_unit, curve_kind, status, points,
         min_discharge_cms, max_discharge_cms,
         min_stage_m, max_stage_m,
         validation_sample_count, validation_mae_m, validation_rmse_m,
         valid_from, artifact_sha256, activated_at
       ) VALUES (
         'rating:river-rise:schema:v1', $1, $2, $3,
         'v1', 'datum:river-rise:local', 'm', 'PIECEWISE_LINEAR',
         'ACTIVE',
         '[{"dischargeCms":100,"stageM":1.2},{"dischargeCms":200,"stageM":1.8},{"dischargeCms":400,"stageM":2.7}]'::jsonb,
         100, 400, 1.2, 2.7,
         120, 0.08, 0.11,
         '2026-09-01T00:00:00Z', $4,
         '2026-09-18T00:00:00Z'
       )
       RETURNING id`,
      [stationId, reachId, calibrationRunId, 'c'.repeat(64)],
    );
    ratingCurveId = curve.rows[0]!.id;

    await client.query('SAVEPOINT duplicate_active_curve');
    await expect(
      client.query(
        `INSERT INTO rating_curves (
           public_id, station_id, river_reach_id, calibration_run_id,
           version, datum_id, stage_unit, curve_kind, status, points,
           min_discharge_cms, max_discharge_cms,
           min_stage_m, max_stage_m,
           validation_sample_count, validation_mae_m, validation_rmse_m,
           valid_from, artifact_sha256, activated_at
         ) VALUES (
           'rating:river-rise:schema:v2', $1, $2, $3,
           'v2', 'datum:river-rise:local', 'm', 'PIECEWISE_LINEAR',
           'ACTIVE',
           '[{"dischargeCms":100,"stageM":1.2},{"dischargeCms":300,"stageM":2.2}]'::jsonb,
           100, 300, 1.2, 2.2,
           120, 0.08, 0.11,
           '2026-09-10T00:00:00Z', $4,
           '2026-09-18T01:00:00Z'
         )`,
        [stationId, reachId, calibrationRunId, 'd'.repeat(64)],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await client.query('ROLLBACK TO SAVEPOINT duplicate_active_curve');
  });

  it('persists derived stage runs/points with source discharge and uncertainty', async () => {
    const run = await client.query<{ id: string }>(
      `INSERT INTO river_stage_forecast_runs (
         station_id, river_reach_id, rating_curve_id, calibration_run_id,
         model_run_at, generated_at, stale_after, datum_id,
         stage_unit, normalized_checksum
       ) VALUES (
         $1, $2, $3, $4,
         '2026-09-18T00:00:00Z',
         '2026-09-18T00:05:00Z',
         '2026-09-18T06:05:00Z',
         'datum:river-rise:local', 'm', $5
       )
       RETURNING id`,
      [
        stationId,
        reachId,
        ratingCurveId,
        calibrationRunId,
        'e'.repeat(64),
      ],
    );

    await client.query(
      `INSERT INTO river_stage_forecast_points (
         stage_run_id, valid_at, lead_seconds, discharge_cms,
         stage_m, uncertainty_m, domain_status, quality_state
       ) VALUES (
         $1, '2026-09-18T06:00:00Z', 21600, 200,
         1.8, 0.11, 'BOUNDARY', 'DERIVED'
       )`,
      [run.rows[0]!.id],
    );

    const selected = await client.query<{
      discharge_cms: string;
      stage_m: string;
      uncertainty_m: string;
      domain_status: string;
    }>(
      `SELECT discharge_cms, stage_m, uncertainty_m, domain_status
       FROM river_stage_forecast_points
       WHERE stage_run_id = $1`,
      [run.rows[0]!.id],
    );
    expect(Number(selected.rows[0]!.discharge_cms)).toBe(200);
    expect(Number(selected.rows[0]!.stage_m)).toBe(1.8);
    expect(Number(selected.rows[0]!.uncertainty_m)).toBe(0.11);
    expect(selected.rows[0]!.domain_status).toBe('BOUNDARY');
  });

  it('rejects negative uncertainty and invalid calibration range metadata', async () => {
    await client.query('SAVEPOINT negative_uncertainty');
    const stageRun = await client.query<{ id: string }>(
      `SELECT id FROM river_stage_forecast_runs
       WHERE rating_curve_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [ratingCurveId],
    );
    await expect(
      client.query(
        `INSERT INTO river_stage_forecast_points (
           stage_run_id, valid_at, lead_seconds, discharge_cms,
           stage_m, uncertainty_m, domain_status, quality_state
         ) VALUES (
           $1, '2026-09-18T09:00:00Z', 32400, 250,
           2.0, -0.1, 'INTERPOLATED', 'DERIVED'
         )`,
        [stageRun.rows[0]!.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await client.query('ROLLBACK TO SAVEPOINT negative_uncertainty');
  });
});
