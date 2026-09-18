import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  CalibrationRunSummary,
  RatingCurveModel,
} from '@connuoc/shared-types';

import { StageCalibrationRepository } from '../src/modules/hydrology/stage-calibration.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for stage calibration repository integration tests',
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'stage-calibration-repository-integration',
});

let repository: StageCalibrationRepository;

const checksumA =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const checksumB =
  'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';

function calibration(
  version: string,
  testRmseM: number,
  acceptedTestRmseM: number,
  datumId = 'VN-LOCAL-DATUM-CAL',
): CalibrationRunSummary {
  return {
    id: `calibration:repo:${version}`,
    version,
    stationId: 'station:calibration-repo',
    riverReachId: 'reach:calibration-repo',
    datumId,
    sourceIds: ['source:calibration-repo'],
    modelKind: 'RATING_CURVE',
    modelVersion: `rating-curve-${version}`,
    featureVersion: 'stage-discharge-pairs-v1',
    splitStrategy: 'CHRONOLOGICAL_HOLDOUT',
    trainPeriod: {
      start: '2024-01-01T00:00:00Z',
      end: '2024-12-31T23:59:59Z',
    },
    validationPeriod: {
      start: '2025-01-01T00:00:00Z',
      end: '2025-06-30T23:59:59Z',
    },
    testPeriod: {
      start: '2025-07-01T00:00:00Z',
      end: '2025-12-31T23:59:59Z',
    },
    validationMetrics: {
      maeM: 0.08,
      rmseM: 0.12,
      sampleCount: 120,
    },
    testMetrics: {
      maeM: Math.max(0, testRmseM - 0.05),
      rmseM: testRmseM,
      sampleCount: 80,
    },
    acceptedTestRmseM,
    metricBreakdowns: [
      {
        datasetSplit: 'TEST',
        leadSeconds: 21_600,
        season: null,
        eventSubset: null,
        metrics: {
          maeM: Math.max(0, testRmseM - 0.04),
          rmseM: testRmseM,
          sampleCount: 40,
        },
      },
      {
        datasetSplit: 'TEST',
        leadSeconds: 43_200,
        season: null,
        eventSubset: null,
        metrics: {
          maeM: Math.max(0, testRmseM - 0.03),
          rmseM: testRmseM,
          sampleCount: 40,
        },
      },
    ],
    artifactChecksumSha256:
      version === 'v1' ? checksumA : checksumB,
    deploymentStatus: 'CANDIDATE',
  };
}

function curve(
  version: string,
  calibrationRunId: string,
  offsetM = 0,
  datumId = 'VN-LOCAL-DATUM-CAL',
): RatingCurveModel {
  return {
    id: `curve:repo:${version}`,
    version,
    stationId: 'station:calibration-repo',
    riverReachId: 'reach:calibration-repo',
    calibrationRunId,
    datumId,
    method: 'PIECEWISE_LINEAR',
    stageUnit: 'm',
    dischargeUnit: 'm3/s',
    validDischargeMinCms: 100,
    validDischargeMaxCms: 500,
    extrapolationPolicy: 'REJECT',
    status: 'CANDIDATE',
    points: [
      { dischargeCms: 100, stageM: 1.2 + offsetM },
      { dischargeCms: 250, stageM: 2.0 + offsetM },
      { dischargeCms: 500, stageM: 3.4 + offsetM },
    ],
  };
}

beforeAll(async () => {
  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES (
       'source:calibration-repo',
       'Stage Calibration Repository Fixture',
       'fixture'
     )
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:calibration-repo', 'Calibration Repo Basin')
     RETURNING id`,
  );

  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:calibration-repo',
       $1,
       'Calibration Repo River',
       ST_Multi(
         ST_GeomFromText(
           'LINESTRING(105.45 19.45,105.65 19.65)',
           4326
         )
       )
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const reach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id,
       river_id,
       basin_id,
       name,
       geometry,
       geometry_source_id
     ) VALUES (
       'reach:calibration-repo',
       $1,
       $2,
       'Calibration Repo Reach',
       ST_Multi(
         ST_GeomFromText(
           'LINESTRING(105.49 19.49,105.52 19.52)',
           4326
         )
       ),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );

  const station = await pool.query<{ id: string }>(
    `INSERT INTO stations (
       public_id,
       name,
       station_type,
       time_zone,
       location,
       river_id,
       default_datum_id
     ) VALUES (
       'station:calibration-repo',
       'Calibration Repo Gauge',
       'water_level',
       'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326),
       $1,
       'VN-LOCAL-DATUM-CAL'
     )
     RETURNING id`,
    [river.rows[0]!.id],
  );

  await pool.query(
    `INSERT INTO gauge_reach_links (
       station_id,
       river_reach_id,
       link_state,
       link_method,
       confidence,
       distance_km,
       effective_from
     ) VALUES (
       $1,
       $2,
       'MAPPED',
       'MANUAL',
       0.99,
       0.05,
       '2026-01-01T00:00:00Z'
     )`,
    [station.rows[0]!.id, reach.rows[0]!.id],
  );

  repository = new StageCalibrationRepository(pool);
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM stage_forecast_runs
     WHERE station_id IN (
       SELECT id FROM stations
       WHERE public_id = 'station:calibration-repo'
     )`,
  );
  await pool.query(
    `DELETE FROM rating_curves
     WHERE station_id IN (
       SELECT id FROM stations
       WHERE public_id = 'station:calibration-repo'
     )`,
  );
  await pool.query(
    `DELETE FROM calibration_runs
     WHERE station_id IN (
       SELECT id FROM stations
       WHERE public_id = 'station:calibration-repo'
     )`,
  );
  await pool.query(
    `DELETE FROM gauge_reach_links
     WHERE station_id IN (
       SELECT id FROM stations
       WHERE public_id = 'station:calibration-repo'
     )`,
  );
  await pool.query(
    `DELETE FROM stations
     WHERE public_id = 'station:calibration-repo'`,
  );
  await pool.query(
    `DELETE FROM river_reaches
     WHERE public_id = 'reach:calibration-repo'`,
  );
  await pool.query(
    `DELETE FROM rivers
     WHERE public_id = 'river:calibration-repo'`,
  );
  await pool.query(
    `DELETE FROM basins
     WHERE public_id = 'basin:calibration-repo'`,
  );
  await pool.query(
    `DELETE FROM data_sources
     WHERE source_key = 'source:calibration-repo'`,
  );
  await pool.end();
});

describe('StageCalibrationRepository', () => {
  it('saves reproducible candidate calibration and rating-curve artifacts idempotently', async () => {
    const run = calibration('v1', 0.18, 0.2);
    const firstRunId = await repository.saveCalibrationRun(run);
    const secondRunId = await repository.saveCalibrationRun(run);
    expect(secondRunId).toBe(firstRunId);

    const model = curve('v1', run.id);
    const firstCurveId = await repository.saveRatingCurve(model);
    const secondCurveId = await repository.saveRatingCurve(model);
    expect(secondCurveId).toBe(firstCurveId);

    const counts = await pool.query<{
      runs: string;
      curves: string;
      points: string;
      breakdowns: string;
    }>(
      `SELECT
         (
           SELECT count(*)::text
           FROM calibration_runs
           WHERE public_id = 'calibration:repo:v1'
         ) AS runs,
         (
           SELECT count(*)::text
           FROM rating_curves
           WHERE public_id = 'curve:repo:v1'
         ) AS curves,
         (
           SELECT count(*)::text
           FROM rating_curve_points p
           JOIN rating_curves c ON c.id = p.rating_curve_id
           WHERE c.public_id = 'curve:repo:v1'
         ) AS points,
         (
           SELECT count(*)::text
           FROM calibration_metric_breakdowns m
           JOIN calibration_runs r
             ON r.id = m.calibration_run_id
           WHERE r.public_id = 'calibration:repo:v1'
         ) AS breakdowns`,
    );

    expect(counts.rows[0]).toEqual({
      runs: '1',
      curves: '1',
      points: '3',
      breakdowns: '2',
    });
  });

  it('activates, supersedes and transactionally rolls back rating-curve versions', async () => {
    const run1 = calibration('v1', 0.18, 0.2);
    const run2 = calibration('v2', 0.15, 0.2);
    await repository.saveCalibrationRun(run1);
    await repository.saveCalibrationRun(run2);
    await repository.saveRatingCurve(curve('v1', run1.id));
    await repository.saveRatingCurve(
      curve('v2', run2.id, 0.05),
    );

    await repository.activateRatingCurve(
      'curve:repo:v1',
      '2026-09-18T00:00:00Z',
    );
    await expect(
      repository.findActiveCurveForReach(
        'reach:calibration-repo',
        '2026-09-18T00:30:00Z',
      ),
    ).resolves.toMatchObject({
      curve: {
        id: 'curve:repo:v1',
        status: 'ACTIVE',
      },
      calibration: {
        id: 'calibration:repo:v1',
        deploymentStatus: 'ACTIVE',
      },
    });

    await repository.activateRatingCurve(
      'curve:repo:v2',
      '2026-09-18T01:00:00Z',
    );
    const afterV2 = await pool.query<{
      curve_version: string;
      status: string;
      run_status: string;
    }>(
      `SELECT
         c.curve_version,
         c.status,
         r.deployment_status AS run_status
       FROM rating_curves c
       JOIN calibration_runs r
         ON r.id = c.calibration_run_id
       WHERE c.public_id IN ('curve:repo:v1', 'curve:repo:v2')
       ORDER BY c.curve_version`,
    );
    expect(afterV2.rows).toEqual([
      {
        curve_version: 'v1',
        status: 'SUPERSEDED',
        run_status: 'ROLLED_BACK',
      },
      {
        curve_version: 'v2',
        status: 'ACTIVE',
        run_status: 'ACTIVE',
      },
    ]);

    await repository.rollbackToRatingCurve(
      'curve:repo:v1',
      '2026-09-18T02:00:00Z',
    );
    const active = await repository.findActiveCurveForReach(
      'reach:calibration-repo',
      '2026-09-18T02:30:00Z',
    );
    expect(active).toMatchObject({
      curve: {
        id: 'curve:repo:v1',
        status: 'ACTIVE',
        datumId: 'VN-LOCAL-DATUM-CAL',
      },
      calibration: {
        id: 'calibration:repo:v1',
        deploymentStatus: 'ACTIVE',
        testMetrics: {
          rmseM: 0.18,
        },
        acceptedTestRmseM: 0.2,
      },
    });
    expect(active?.calibration.metricBreakdowns).toHaveLength(2);
  });

  it('rejects activation when the curve datum does not match the station datum', async () => {
    const run = calibration(
      'bad-datum',
      0.15,
      0.2,
      'OTHER-DATUM',
    );
    await repository.saveCalibrationRun(run);
    await repository.saveRatingCurve(
      curve(
        'bad-datum',
        run.id,
        0,
        'OTHER-DATUM',
      ),
    );

    await expect(
      repository.activateRatingCurve(
        'curve:repo:bad-datum',
        '2026-09-18T03:00:00Z',
      ),
    ).rejects.toThrow(/datum/i);
  });

  it('rejects activation if stored rating-curve points no longer match the artifact checksum', async () => {
    const run = calibration('bad-checksum', 0.15, 0.2);
    await repository.saveCalibrationRun(run);
    await repository.saveRatingCurve(
      curve('bad-checksum', run.id),
    );

    await pool.query(
      `UPDATE rating_curves
       SET curve_checksum_sha256 = $2
       WHERE public_id = $1`,
      ['curve:repo:bad-checksum', 'b'.repeat(64)],
    );

    await expect(
      repository.activateRatingCurve(
        'curve:repo:bad-checksum',
        '2026-09-18T04:00:00Z',
      ),
    ).rejects.toThrow(/checksum/i);
  });

  it('exposes held-out lead-time metrics for audit and model comparison', async () => {
    const metrics =
      await repository.findCalibrationMetrics(
        'calibration:repo:v1',
      );

    expect(metrics).toEqual([
      {
        datasetSplit: 'TEST',
        leadSeconds: 21_600,
        season: null,
        eventSubset: null,
        metrics: {
          maeM: 0.14,
          rmseM: 0.18,
          sampleCount: 40,
        },
      },
      {
        datasetSplit: 'TEST',
        leadSeconds: 43_200,
        season: null,
        eventSubset: null,
        metrics: {
          maeM: 0.15,
          rmseM: 0.18,
          sampleCount: 40,
        },
      },
    ]);
  });
});
