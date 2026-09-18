import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RiverRiseRepository } from '../src/modules/river-rise/river-rise.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for river-rise repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'river-rise-repository-integration',
});

let client: PoolClient;
let repository: RiverRiseRepository;
let stationId: string;
let reachId: string;
let calibration1Id: string;
let calibration2Id: string;

beforeAll(async () => {
  client = await pool.connect();
  const source = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('river-rise-repo-fixture', 'River rise repository fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await client.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:river-rise:repo', 'River Rise Repository Basin')
     RETURNING id`,
  );

  const river = await client.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:river-rise:repo', $1, 'River Rise Repository River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.4 19.4,105.6 19.6)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const reach = await client.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:river-rise:repo', $1, $2, 'River Rise Repository Reach',
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
       'station:river-rise:repo', 'River Rise Repository Gauge',
       'water_level', 'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326),
       $1, $2, 'datum:river-rise:repo'
     )
     RETURNING id`,
    [river.rows[0]!.id, reachId],
  );
  stationId = station.rows[0]!.id;

  const calibration1 = await client.query<{ id: string }>(
    `INSERT INTO calibration_runs (
       public_id, station_id, river_reach_id,
       model_family, model_version, feature_version, source_ids,
       training_start, training_end,
       validation_start, validation_end,
       test_start, test_end,
       split_strategy, sample_count, mae_m, rmse_m, bias_m,
       lead_metrics, artifact_sha256, status, activated_at
     ) VALUES (
       'calibration:river-rise:repo:v1', $1, $2,
       'RATING_CURVE_PIECEWISE_LINEAR', 'v1', 'pairs-v1',
       ARRAY['source:gauge:repo'],
       '2025-01-01T00:00:00Z', '2026-03-31T23:59:59Z',
       '2026-04-01T00:00:00Z', '2026-06-30T23:59:59Z',
       '2026-07-01T00:00:00Z', '2026-08-31T23:59:59Z',
       'TIME_ORDERED_HOLDOUT', 120, 0.08, 0.11, 0.01,
       '[]'::jsonb, $3, 'ACTIVE', '2026-09-01T00:00:00Z'
     )
     RETURNING id`,
    [stationId, reachId, '1'.repeat(64)],
  );
  calibration1Id = calibration1.rows[0]!.id;

  const calibration2 = await client.query<{ id: string }>(
    `INSERT INTO calibration_runs (
       public_id, station_id, river_reach_id,
       model_family, model_version, feature_version, source_ids,
       training_start, training_end,
       validation_start, validation_end,
       test_start, test_end,
       split_strategy, sample_count, mae_m, rmse_m, bias_m,
       lead_metrics, artifact_sha256, status
     ) VALUES (
       'calibration:river-rise:repo:v2', $1, $2,
       'RATING_CURVE_PIECEWISE_LINEAR', 'v2', 'pairs-v2',
       ARRAY['source:gauge:repo'],
       '2025-02-01T00:00:00Z', '2026-04-30T23:59:59Z',
       '2026-05-01T00:00:00Z', '2026-07-31T23:59:59Z',
       '2026-08-01T00:00:00Z', '2026-08-31T23:59:59Z',
       'TIME_ORDERED_HOLDOUT', 160, 0.06, 0.09, 0.00,
       '[]'::jsonb, $3, 'APPROVED'
     )
     RETURNING id`,
    [stationId, reachId, '2'.repeat(64)],
  );
  calibration2Id = calibration2.rows[0]!.id;

  await client.query(
    `INSERT INTO rating_curves (
       public_id, station_id, river_reach_id, calibration_run_id,
       version, datum_id, stage_unit, curve_kind, status, points,
       min_discharge_cms, max_discharge_cms, min_stage_m, max_stage_m,
       validation_sample_count, validation_mae_m, validation_rmse_m,
       valid_from, artifact_sha256, activated_at
     ) VALUES
       (
         'rating:river-rise:repo:v1', $1, $2, $3,
         'v1', 'datum:river-rise:repo', 'm', 'PIECEWISE_LINEAR',
         'ACTIVE',
         '[{"dischargeCms":100,"stageM":1.2},{"dischargeCms":200,"stageM":1.8},{"dischargeCms":400,"stageM":2.7}]'::jsonb,
         100, 400, 1.2, 2.7, 120, 0.08, 0.11,
         '2026-09-01T00:00:00Z', $4, '2026-09-01T00:00:00Z'
       ),
       (
         'rating:river-rise:repo:v2', $1, $2, $5,
         'v2', 'datum:river-rise:repo', 'm', 'PIECEWISE_LINEAR',
         'CANDIDATE',
         '[{"dischargeCms":100,"stageM":1.25},{"dischargeCms":200,"stageM":1.85},{"dischargeCms":450,"stageM":2.9}]'::jsonb,
         100, 450, 1.25, 2.9, 160, 0.06, 0.09,
         '2026-09-10T00:00:00Z', $6, NULL
       )`,
    [
      stationId,
      reachId,
      calibration1Id,
      '3'.repeat(64),
      calibration2Id,
      '4'.repeat(64),
    ],
  );

  repository = new RiverRiseRepository(pool);
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM audit_log
     WHERE target_type = 'rating_curve'
       AND actor_id = 'ci-calibration-operator'`,
  );
  await pool.query(
    `DELETE FROM river_stage_forecast_runs
     WHERE station_id = $1`,
    [stationId],
  );
  await pool.query(
    `DELETE FROM rating_curves
     WHERE station_id = $1`,
    [stationId],
  );
  await pool.query(
    `DELETE FROM calibration_runs
     WHERE station_id = $1`,
    [stationId],
  );
  await pool.query(
    `DELETE FROM stations
     WHERE public_id = 'station:river-rise:repo'`,
  );
  await pool.query(
    `DELETE FROM river_reaches
     WHERE public_id = 'reach:river-rise:repo'`,
  );
  await pool.query(
    `DELETE FROM rivers
     WHERE public_id = 'river:river-rise:repo'`,
  );
  await pool.query(
    `DELETE FROM basins
     WHERE public_id = 'basin:river-rise:repo'`,
  );
  await pool.query(
    `DELETE FROM data_sources
     WHERE source_key = 'river-rise-repo-fixture'`,
  );
  client?.release();
  await pool.end();
});

describe('RiverRiseRepository', () => {
  it('returns station/reach context and the active rating curve at request time', async () => {
    const context = await repository.findStationContext(
      'station:river-rise:repo',
      '2026-09-18T00:00:00Z',
    );

    expect(context).toMatchObject({
      stationId: 'station:river-rise:repo',
      stationName: 'River Rise Repository Gauge',
      riverReachId: 'reach:river-rise:repo',
      datumId: 'datum:river-rise:repo',
      latitude: 19.5,
      longitude: 105.5,
      activeCurve: {
        id: 'rating:river-rise:repo:v1',
        version: 'v1',
        datumId: 'datum:river-rise:repo',
        status: 'ACTIVE',
        validation: {
          sampleCount: 120,
          maeM: 0.08,
          rmseM: 0.11,
        },
      },
    });
  });

  it('activates an approved curve atomically and retains rollback history', async () => {
    await repository.activateRatingCurve(
      'rating:river-rise:repo:v2',
      'ci-calibration-operator',
      '2026-09-18T01:00:00Z',
    );

    const states = await client.query<{
      public_id: string;
      status: string;
    }>(
      `SELECT public_id, status
       FROM rating_curves
       WHERE station_id = $1
       ORDER BY public_id`,
      [stationId],
    );
    expect(states.rows).toEqual([
      {
        public_id: 'rating:river-rise:repo:v1',
        status: 'ROLLED_BACK',
      },
      {
        public_id: 'rating:river-rise:repo:v2',
        status: 'ACTIVE',
      },
    ]);

    const calibrationStates = await client.query<{
      public_id: string;
      status: string;
    }>(
      `SELECT public_id, status
       FROM calibration_runs
       WHERE id = ANY($1::uuid[])
       ORDER BY public_id`,
      [[calibration1Id, calibration2Id]],
    );
    expect(calibrationStates.rows).toEqual([
      {
        public_id: 'calibration:river-rise:repo:v1',
        status: 'ROLLED_BACK',
      },
      {
        public_id: 'calibration:river-rise:repo:v2',
        status: 'ACTIVE',
      },
    ]);

    const context = await repository.findStationContext(
      'station:river-rise:repo',
      '2026-09-18T02:00:00Z',
    );
    expect(context?.activeCurve?.version).toBe('v2');
  });

  it('rolls back to a prior validated version without deleting newer history', async () => {
    await repository.rollbackRatingCurve(
      'rating:river-rise:repo:v1',
      'ci-calibration-operator',
      '2026-09-18T03:00:00Z',
    );

    const context = await repository.findStationContext(
      'station:river-rise:repo',
      '2026-09-18T04:00:00Z',
    );
    expect(context?.activeCurve?.version).toBe('v1');

    const curveCount = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM rating_curves
       WHERE station_id = $1`,
      [stationId],
    );
    expect(curveCount.rows[0]!.count).toBe('2');

    const audits = await client.query<{ action: string }>(
      `SELECT action
       FROM audit_log
       WHERE target_type = 'rating_curve'
         AND actor_id = 'ci-calibration-operator'
       ORDER BY occurred_at`,
    );
    expect(audits.rows.map((row) => row.action)).toEqual([
      'river-rise.rating-curve.activate',
      'river-rise.rating-curve.rollback',
    ]);
  });
});
