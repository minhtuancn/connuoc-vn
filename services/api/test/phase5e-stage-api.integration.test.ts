import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  CalibrationRunSummary,
  RatingCurveModel,
} from '@connuoc/shared-types';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { CalibrationRepository } from '../src/modules/calibration/calibration.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for Phase 5E stage API integration tests',
  );
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'phase5e-stage-api-integration',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let providerId: string;

const checksum =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function calibration(): CalibrationRunSummary {
  return {
    id: 'calibration:phase5e:api:v1',
    version: 'v1',
    stationId: 'station:phase5e:api',
    riverReachId: 'reach:phase5e:api',
    datumId: 'VN-LOCAL-DATUM-PHASE5E',
    sourceIds: ['phase5e-stage-api-fixture'],
    modelKind: 'RATING_CURVE',
    modelVersion: 'piecewise-linear-v1',
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
      maeM: 0.07,
      rmseM: 0.1,
      sampleCount: 120,
    },
    testMetrics: {
      maeM: 0.09,
      rmseM: 0.13,
      sampleCount: 80,
    },
    acceptedTestRmseM: 0.2,
    metricBreakdowns: [
      {
        datasetSplit: 'TEST',
        leadSeconds: 21_600,
        season: null,
        eventSubset: null,
        metrics: {
          maeM: 0.1,
          rmseM: 0.14,
          sampleCount: 40,
        },
      },
    ],
    artifactChecksumSha256: checksum,
    deploymentStatus: 'CANDIDATE',
  };
}

function curve(): RatingCurveModel {
  return {
    id: 'curve:phase5e:api:v1',
    version: 'v1',
    stationId: 'station:phase5e:api',
    riverReachId: 'reach:phase5e:api',
    calibrationRunId: 'calibration:phase5e:api:v1',
    datumId: 'VN-LOCAL-DATUM-PHASE5E',
    method: 'PIECEWISE_LINEAR',
    stageUnit: 'm',
    dischargeUnit: 'm3/s',
    validDischargeMinCms: 450,
    validDischargeMaxCms: 520,
    extrapolationPolicy: 'REJECT',
    status: 'CANDIDATE',
    points: [
      { dischargeCms: 450, stageM: 1.5 },
      { dischargeCms: 500, stageM: 2.0 },
      { dischargeCms: 520, stageM: 2.2 },
    ],
  };
}

function assertNoUnsafeStageClaims(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerConfigId',
    'providerKey',
    'secretRef',
    'endpointConfig',
    'artifactUri',
    'floodProbability',
    'officialFloodWarning',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE
    stage_forecast_points,
    stage_forecast_runs,
    rating_curve_points,
    rating_curves,
    calibration_metric_breakdowns,
    calibration_runs,
    gauge_reach_links,
    hydrology_return_periods,
    hydrology_discharge_points,
    hydrology_forecast_runs,
    river_reach_provider_mappings,
    river_reaches,
    provider_health_events,
    provider_capabilities,
    provider_configs,
    stations,
    estuaries,
    rivers,
    basins,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES (
       'phase5e-stage-api-fixture',
       'Phase 5E Stage API Fixture',
       'fixture'
     )
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:phase5e:api', 'Phase 5E API Basin')
     RETURNING id`,
  );

  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:phase5e:api',
       $1,
       'Phase 5E API River',
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

  const reaches = await pool.query<{
    id: string;
    public_id: string;
  }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name,
       geometry, geometry_source_id
     ) VALUES
       (
         'reach:phase5e:api',
         $1, $2, 'Phase 5E Calibrated Reach',
         ST_Multi(
           ST_GeomFromText(
             'LINESTRING(105.49 19.49,105.51 19.51)',
             4326
           )
         ),
         $3
       ),
       (
         'reach:phase5e:no-calibration',
         $1, $2, 'Phase 5E Uncalibrated Reach',
         ST_Multi(
           ST_GeomFromText(
             'LINESTRING(105.52 19.52,105.54 19.54)',
             4326
           )
         ),
         $3
       )
     RETURNING id, public_id`,
    [
      river.rows[0]!.id,
      basin.rows[0]!.id,
      source.rows[0]!.id,
    ],
  );
  const reachByPublicId = new Map(
    reaches.rows.map((row) => [row.public_id, row.id]),
  );

  const station = await pool.query<{ id: string }>(
    `INSERT INTO stations (
       public_id, name, station_type, time_zone,
       location, river_id, default_datum_id
     ) VALUES (
       'station:phase5e:api',
       'Phase 5E API Gauge',
       'water_level',
       'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(105.5, 19.5), 4326),
       $1,
       'VN-LOCAL-DATUM-PHASE5E'
     )
     RETURNING id`,
    [river.rows[0]!.id],
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type,
       enabled, priority, weight,
       commercial_use_status, redistribution_status,
       licence_status, attribution_text,
       coverage, freshness_policy,
       health_state, health_blocks_selection
     ) VALUES (
       'phase5e-stage-fixture-provider',
       $1,
       'fixture',
       true,
       100,
       1,
       'ALLOWED',
       'ATTRIBUTION_REQUIRED',
       'REVIEWED',
       'Con Nước Phase 5E synthetic hydrology fixture',
       ST_Multi(
         ST_GeomFromText(
           'POLYGON((105.3 19.3,105.8 19.3,105.8 19.8,105.3 19.8,105.3 19.3))',
           4326
         )
       ),
       '{"maxAgeSeconds":3600}'::jsonb,
       'HEALTHY',
       false
     )
     RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  await pool.query(
    `INSERT INTO provider_capabilities (
       provider_config_id, capability, enabled
     ) VALUES
       ($1, 'hydrology.dischargeForecast', true),
       ($1, 'hydrology.returnPeriods', true)`,
    [providerId],
  );

  for (const [publicId, providerReachId] of [
    ['reach:phase5e:api', 'fixture-stage-reach'],
    ['reach:phase5e:no-calibration', 'fixture-no-calibration'],
  ] as const) {
    await pool.query(
      `INSERT INTO river_reach_provider_mappings (
         river_reach_id, provider_config_id, provider_reach_id,
         provider_product_id, provider_product_version,
         mapping_state, mapping_method, confidence,
         distance_km, effective_from
       ) VALUES (
         $1, $2, $3,
         'fixture-hydrology', '1',
         'MAPPED', 'MANUAL', 0.99,
         0.05, '2026-01-01T00:00:00Z'
       )`,
      [
        reachByPublicId.get(publicId),
        providerId,
        providerReachId,
      ],
    );
  }

  await pool.query(
    `INSERT INTO gauge_reach_links (
       station_id, river_reach_id, link_state,
       link_method, confidence, distance_km,
       effective_from
     ) VALUES (
       $1, $2, 'MAPPED',
       'MANUAL', 0.99, 0.05,
       '2026-01-01T00:00:00Z'
     )`,
    [
      station.rows[0]!.id,
      reachByPublicId.get('reach:phase5e:api'),
    ],
  );

  const repository = new CalibrationRepository(pool);
  await repository.saveCalibrationRun(calibration(), {
    validatedAtUtc: '2026-09-01T00:00:00Z',
  });
  await repository.saveRatingCurve(curve());
  await repository.activateRatingCurve(
    'curve:phase5e:api:v1',
    '2026-09-18T00:00:00Z',
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Phase 5E public stage calibration APIs', () => {
  it('exposes active calibration evidence without internal artifact/credential fields', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/hydrology/stations/station%3Aphase5e%3Aapi/calibration',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      stationId: 'station:phase5e:api',
      status: 'ACTIVE',
      reachId: 'reach:phase5e:api',
      datumId: 'VN-LOCAL-DATUM-PHASE5E',
      curve: {
        id: 'curve:phase5e:api:v1',
        version: 'v1',
        validDischargeMinCms: 450,
        validDischargeMaxCms: 520,
        extrapolationPolicy: 'REJECT',
      },
      calibration: {
        id: 'calibration:phase5e:api:v1',
        version: 'v1',
        testMetrics: {
          maeM: 0.09,
          rmseM: 0.13,
          sampleCount: 80,
        },
        acceptedTestRmseM: 0.2,
      },
    });
    assertNoUnsafeStageClaims(response.json());
  });

  it('returns exact derived stage only for in-domain discharge with explicit datum and uncertainty', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5e%3Aapi/stage-forecast?days=1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reachId: 'reach:phase5e:api',
      discharge: {
        unit: 'm3/s',
      },
      stage: {
        status: 'AVAILABLE',
        stationId: 'station:phase5e:api',
        datumId: 'VN-LOCAL-DATUM-PHASE5E',
        unit: 'm',
        baseline: {
          kind: 'FIRST_FORECAST',
          datumId: 'VN-LOCAL-DATUM-PHASE5E',
        },
        curve: {
          id: 'curve:phase5e:api:v1',
          extrapolationPolicy: 'REJECT',
        },
        uncertainty: {
          basis: 'HELD_OUT_TEST',
          maeM: 0.09,
          rmseM: 0.13,
          sampleCount: 80,
        },
      },
    });
    expect(response.json().stage.points).toHaveLength(2);
    expect(
      response
        .json()
        .stage.points.every(
          (point: { status: string; stageM: number | null; extrapolated: boolean }) =>
            point.status === 'AVAILABLE' &&
            point.stageM !== null &&
            point.extrapolated === false,
        ),
    ).toBe(true);
    assertNoUnsafeStageClaims(response.json());

    const persisted = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM stage_forecast_runs`,
    );
    expect(Number(persisted.rows[0]!.count)).toBeGreaterThanOrEqual(1);
  });

  it('returns PARTIAL and null stage outside the validated discharge domain instead of extrapolating', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5e%3Aapi/stage-forecast?days=2',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().stage.status).toBe('PARTIAL');
    expect(response.json().stage.limitations).toContain(
      'SOME_DISCHARGE_OUTSIDE_CALIBRATED_DOMAIN',
    );
    const outside = response
      .json()
      .stage.points.filter(
        (point: { status: string }) =>
          point.status === 'OUTSIDE_CALIBRATED_DOMAIN',
      );
    expect(outside.length).toBeGreaterThan(0);
    expect(
      outside.every(
        (point: { stageM: number | null; extrapolated: boolean }) =>
          point.stageM === null && point.extrapolated === false,
      ),
    ).toBe(true);
    assertNoUnsafeStageClaims(response.json());
  });

  it('keeps discharge context but returns INSUFFICIENT_DATA when no active calibration exists', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5e%3Ano-calibration/stage-forecast?days=1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      discharge: {
        unit: 'm3/s',
      },
      stage: {
        status: 'INSUFFICIENT_DATA',
        stationId: null,
        datumId: null,
        direction: 'UNKNOWN',
        points: [],
        limitations: ['NO_ACTIVE_VALIDATED_CALIBRATION'],
      },
    });
    assertNoUnsafeStageClaims(response.json());
  });

  it('does not expose an exact stage calibration for an unknown station', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/hydrology/stations/station%3Aunknown/calibration',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      stationId: 'station:unknown',
      status: 'INSUFFICIENT_DATA',
      reachId: null,
      datumId: null,
      curve: null,
      calibration: null,
      limitations: ['NO_ACTIVE_VALIDATED_CALIBRATION'],
    });
  });

  it.each([
    '/v1/rivers/reach%3Aphase5e%3Aapi/stage-forecast?days=0',
    '/v1/rivers/reach%3Aphase5e%3Aapi/stage-forecast?days=31',
  ])('rejects invalid stage forecast request %s', async (url) => {
    const response = await fastify.inject({
      method: 'GET',
      url,
    });
    expect(response.statusCode).toBe(400);
  });
});
