import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  CalibrationRunSummary,
  RatingCurveModel,
} from '@connuoc/shared-types';

import { CalibrationRepository } from '../src/modules/calibration/calibration.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for calibration repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'calibration-repository-integration',
});

let repository: CalibrationRepository;

function run(version: string): CalibrationRunSummary {
  return {
    id: `calibration:phase5e:${version}`,
    version,
    stationId: 'station:phase5e:gauge',
    riverReachId: 'reach:phase5e:gauge',
    modelKind: 'RATING_CURVE',
    modelVersion: `rating-curve-${version}`,
    featureVersion: 'stage-discharge-pairs-v1',
    splitStrategy: 'CHRONOLOGICAL_HOLDOUT',
    trainPeriod: {
      start: '2024-01-01T00:00:00Z',
      end: '2025-06-30T23:59:59Z',
    },
    validationPeriod: {
      start: '2025-07-01T00:00:00Z',
      end: '2025-12-31T23:59:59Z',
    },
    testPeriod: {
      start: '2026-01-01T00:00:00Z',
      end: '2026-06-30T23:59:59Z',
    },
    validationMetrics: {
      maeM: version === 'v1' ? 0.18 : 0.12,
      rmseM: version === 'v1' ? 0.25 : 0.17,
      sampleCount: 240,
    },
    testMetrics: {
      maeM: version === 'v1' ? 0.2 : 0.14,
      rmseM: version === 'v1' ? 0.28 : 0.19,
      sampleCount: 120,
    },
    artifactChecksumSha256:
      version === 'v1'
        ? '1111111111111111111111111111111111111111111111111111111111111111'
        : '2222222222222222222222222222222222222222222222222222222222222222',
    deploymentStatus: 'CANDIDATE',
  };
}

function curve(version: string, datumId = 'VN-DATUM-PHASE5E'): RatingCurveModel {
  return {
    id: `curve:phase5e:${version}`,
    version,
    stationId: 'station:phase5e:gauge',
    riverReachId: 'reach:phase5e:gauge',
    calibrationRunId: `calibration:phase5e:${version}`,
    datumId,
    method: 'PIECEWISE_LINEAR',
    stageUnit: 'm',
    dischargeUnit: 'm3/s',
    validDischargeMinCms: 100,
    validDischargeMaxCms: 500,
    extrapolationPolicy: 'REJECT',
    status: 'CANDIDATE',
    points: [
      { dischargeCms: 100, stageM: 1.5 },
      { dischargeCms: 250, stageM: version === 'v1' ? 2.8 : 2.75 },
      { dischargeCms: 500, stageM: version === 'v1' ? 4.4 : 4.3 },
    ],
  };
}

beforeAll(async () => {
  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5e-calibration-fixture', 'Phase 5E Calibration Fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:phase5e:gauge', 'Phase 5E Gauge Basin')
     RETURNING id`,
  );
  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:phase5e:gauge', $1, 'Phase 5E Gauge River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.4 19.4,105.6 19.6)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );
  const reach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:phase5e:gauge', $1, $2, 'Phase 5E Gauge Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.49 19.49,105.51 19.51)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );
  const station = await pool.query<{ id: string }>(
    `INSERT INTO stations (
       public_id, name, station_type, time_zone, location, river_id, default_datum_id
     ) VALUES (
       'station:phase5e:gauge', 'Phase 5E Gauge', 'water_level',
       'Asia/Ho_Chi_Minh', ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326),
       $1, 'VN-DATUM-PHASE5E'
     )
     RETURNING id`,
    [river.rows[0]!.id],
  );

  await pool.query(
    `INSERT INTO gauge_reach_links (
       station_id, river_reach_id, link_method, confidence, distance_km,
       effective_from
     ) VALUES ($1, $2, 'MANUAL', 1.0, 0.05, '2026-01-01T00:00:00Z')`,
    [station.rows[0]!.id, reach.rows[0]!.id],
  );

  repository = new CalibrationRepository(pool);
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM stage_forecast_runs
     WHERE station_id = (SELECT id FROM stations WHERE public_id = 'station:phase5e:gauge')`,
  );
  await pool.query(
    `DELETE FROM rating_curves
     WHERE station_id = (SELECT id FROM stations WHERE public_id = 'station:phase5e:gauge')`,
  );
  await pool.query(
    `DELETE FROM calibration_runs
     WHERE station_id = (SELECT id FROM stations WHERE public_id = 'station:phase5e:gauge')`,
  );
  await pool.query(
    `DELETE FROM gauge_reach_links
     WHERE station_id = (SELECT id FROM stations WHERE public_id = 'station:phase5e:gauge')`,
  );
  await pool.query(`DELETE FROM stations WHERE public_id = 'station:phase5e:gauge'`);
  await pool.query(`DELETE FROM river_reaches WHERE public_id = 'reach:phase5e:gauge'`);
  await pool.query(`DELETE FROM rivers WHERE public_id = 'river:phase5e:gauge'`);
  await pool.query(`DELETE FROM basins WHERE public_id = 'basin:phase5e:gauge'`);
  await pool.query(
    `DELETE FROM data_sources WHERE source_key = 'phase5e-calibration-fixture'`,
  );
  await pool.end();
});

describe('CalibrationRepository activation and rollback', () => {
  it('saves validated evidence and activates a compatible rating curve transactionally', async () => {
    await repository.saveCalibrationRun(run('v1'), {
      sourceSummary: [{ sourceId: 'phase5e-calibration-fixture' }],
      validatedAtUtc: '2026-09-01T00:00:00Z',
    });
    await repository.saveRatingCurve(curve('v1'));

    await repository.activateRatingCurve(
      'curve:phase5e:v1',
      '2026-09-18T00:00:00Z',
    );

    const active = await repository.findActiveCurveForReach(
      'reach:phase5e:gauge',
      '2026-09-18T00:00:01Z',
    );

    expect(active).toMatchObject({
      stationDatumId: 'VN-DATUM-PHASE5E',
      curve: {
        id: 'curve:phase5e:v1',
        version: 'v1',
        status: 'ACTIVE',
        datumId: 'VN-DATUM-PHASE5E',
      },
      calibration: {
        id: 'calibration:phase5e:v1',
        deploymentStatus: 'ACTIVE',
        testMetrics: {
          maeM: 0.2,
          rmseM: 0.28,
          sampleCount: 120,
        },
      },
    });
  });

  it('supersedes the old version on upgrade and supports rollback to prior validated evidence', async () => {
    await repository.saveCalibrationRun(run('v2'), {
      sourceSummary: [{ sourceId: 'phase5e-calibration-fixture' }],
      validatedAtUtc: '2026-09-10T00:00:00Z',
    });
    await repository.saveRatingCurve(curve('v2'));

    await repository.activateRatingCurve(
      'curve:phase5e:v2',
      '2026-09-18T01:00:00Z',
    );

    const upgraded = await repository.findActiveCurveForReach(
      'reach:phase5e:gauge',
      '2026-09-18T01:00:01Z',
    );
    expect(upgraded?.curve.version).toBe('v2');

    const v1State = await pool.query<{
      curve_status: string;
      calibration_status: string;
    }>(
      `SELECT rc.status AS curve_status, cr.deployment_status AS calibration_status
       FROM rating_curves rc
       JOIN calibration_runs cr ON cr.id = rc.calibration_run_id
       WHERE rc.public_id = 'curve:phase5e:v1'`,
    );
    expect(v1State.rows[0]).toEqual({
      curve_status: 'SUPERSEDED',
      calibration_status: 'SUPERSEDED',
    });

    await repository.rollbackToRatingCurve(
      'curve:phase5e:v1',
      '2026-09-18T02:00:00Z',
    );

    const rolledBack = await repository.findActiveCurveForReach(
      'reach:phase5e:gauge',
      '2026-09-18T02:00:01Z',
    );
    expect(rolledBack?.curve.version).toBe('v1');

    const v2State = await pool.query<{
      curve_status: string;
      calibration_status: string;
      rolled_back_at: Date | string | null;
    }>(
      `SELECT
         rc.status AS curve_status,
         cr.deployment_status AS calibration_status,
         cr.rolled_back_at
       FROM rating_curves rc
       JOIN calibration_runs cr ON cr.id = rc.calibration_run_id
       WHERE rc.public_id = 'curve:phase5e:v2'`,
    );
    expect(v2State.rows[0]?.curve_status).toBe('SUPERSEDED');
    expect(v2State.rows[0]?.calibration_status).toBe('ROLLED_BACK');
    expect(v2State.rows[0]?.rolled_back_at).not.toBeNull();
  });

  it('rejects activation when curve datum is incompatible with the gauge datum', async () => {
    const badRun = {
      ...run('v3'),
      id: 'calibration:phase5e:v3',
      version: 'v3',
      artifactChecksumSha256:
        '3333333333333333333333333333333333333333333333333333333333333333',
    };
    await repository.saveCalibrationRun(badRun, {
      sourceSummary: [{ sourceId: 'phase5e-calibration-fixture' }],
      validatedAtUtc: '2026-09-15T00:00:00Z',
    });
    await repository.saveRatingCurve(curve('v3', 'WRONG-DATUM'));

    await expect(
      repository.activateRatingCurve(
        'curve:phase5e:v3',
        '2026-09-18T03:00:00Z',
      ),
    ).rejects.toThrow(/datum/i);
  });

  it('exposes queryable calibration metrics without artifact URI leakage', async () => {
    const metrics = await repository.findCalibrationMetrics(
      'calibration:phase5e:v1',
    );
    expect(metrics).toMatchObject({
      validationMetrics: {
        maeM: 0.18,
        rmseM: 0.25,
        sampleCount: 240,
      },
      testMetrics: {
        maeM: 0.2,
        rmseM: 0.28,
        sampleCount: 120,
      },
    });
    expect(JSON.stringify(metrics)).not.toContain('artifactUri');
  });
});
