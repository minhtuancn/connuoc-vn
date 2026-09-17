import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { NormalizedRainfallBundle } from '@connuoc/weather-worker';

import { RainfallRepository } from '../src/modules/rainfall/rainfall.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for rainfall repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'rainfall-repository-integration',
});

let repository: RainfallRepository;
let providerConfigId: string;

const bundle: NormalizedRainfallBundle = {
  capability: 'rainfall.satellite',
  objectReferences: [
    {
      uri: 's3://hydro-fixtures/imerg/2026/09/17/0200.tif',
      checksumSha256: 'b'.repeat(64),
      mediaType: 'image/tiff; application=geotiff',
    },
  ],
  records: [
    {
      id: 'rain:imerg:0130',
      productKind: 'SATELLITE_ESTIMATE',
      validStart: '2026-09-17T01:30:00Z',
      validEnd: '2026-09-17T02:00:00Z',
      accumulationSeconds: 1800,
      amountMm: 1.25,
      unit: 'mm',
      spatial: {
        representation: 'GRID_CELL',
        latitude: 19.5,
        longitude: 105.5,
        resolutionKm: 10,
        stationId: null,
      },
      quality: { state: 'VALID', flags: [] },
      source: {
        sourceId: 'nasa-gpm-imerg',
        providerConfigId: null,
        productId: 'IMERG-Early',
        productVersion: 'V07B',
        modelRunAt: null,
        observedAt: '2026-09-17T02:00:00Z',
        fetchedAt: '2026-09-17T02:10:00Z',
        attributionText: 'NASA GPM IMERG',
        attributionUrl: 'https://gpm.nasa.gov/data/imerg',
      },
    },
    {
      id: 'rain:imerg:0200',
      productKind: 'SATELLITE_ESTIMATE',
      validStart: '2026-09-17T02:00:00Z',
      validEnd: '2026-09-17T02:30:00Z',
      accumulationSeconds: 1800,
      amountMm: 2.75,
      unit: 'mm',
      spatial: {
        representation: 'GRID_CELL',
        latitude: 19.5,
        longitude: 105.5,
        resolutionKm: 10,
        stationId: null,
      },
      quality: { state: 'VALID', flags: ['NRT'] },
      source: {
        sourceId: 'nasa-gpm-imerg',
        providerConfigId: null,
        productId: 'IMERG-Early',
        productVersion: 'V07B',
        modelRunAt: null,
        observedAt: '2026-09-17T02:30:00Z',
        fetchedAt: '2026-09-17T02:40:00Z',
        attributionText: 'NASA GPM IMERG',
        attributionUrl: 'https://gpm.nasa.gov/data/imerg',
      },
    },
  ],
};

async function seed(): Promise<void> {
  await pool.query(`TRUNCATE TABLE
    rainfall_accumulations,
    rainfall_records,
    rainfall_runs,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('rainfall-cache-fixture', 'Rainfall Cache Fixture', 'fixture')
     RETURNING id`,
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status, health_state
     ) VALUES (
       'rainfall-cache-fixture', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED', 'HEALTHY'
     ) RETURNING id`,
    [source.rows[0]!.id],
  );

  providerConfigId = provider.rows[0]!.id;
}

beforeAll(async () => {
  await seed();
  repository = new RainfallRepository(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('rainfall repository', () => {
  it('persists identical normalized content idempotently without request-location history', async () => {
    const firstRunId = await repository.saveBundle(
      providerConfigId,
      bundle,
      '2026-09-17T03:10:00Z',
    );
    const secondRunId = await repository.saveBundle(
      providerConfigId,
      bundle,
      '2026-09-17T03:10:00Z',
    );

    expect(secondRunId).toBe(firstRunId);

    const runCount = await pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM rainfall_runs',
    );
    const recordCount = await pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM rainfall_records',
    );
    expect(runCount.rows[0]?.count).toBe(1);
    expect(recordCount.rows[0]?.count).toBe(2);

    const run = await pool.query<{
      object_uris: string[];
      source_registry_id: string;
      latitude: number | string;
      longitude: number | string;
    }>(
      `SELECT object_uris, source_registry_id,
              ST_Y(spatial_point::geometry) AS latitude,
              ST_X(spatial_point::geometry) AS longitude
       FROM rainfall_runs WHERE id = $1`,
      [firstRunId],
    );
    expect(run.rows[0]).toMatchObject({
      object_uris: ['s3://hydro-fixtures/imerg/2026/09/17/0200.tif'],
      source_registry_id: 'nasa-gpm-imerg',
    });
    expect(Number(run.rows[0]?.latitude)).toBe(19.5);
    expect(Number(run.rows[0]?.longitude)).toBe(105.5);

    const columns = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'rainfall_runs'`,
    );
    const names = columns.rows.map((row) => row.column_name);
    expect(names).not.toContain('request_latitude');
    expect(names).not.toContain('request_longitude');
    expect(names).not.toContain('user_latitude');
    expect(names).not.toContain('user_longitude');
  });

  it('persists deterministic derived accumulations with lineage and supported windows only', async () => {
    const runId = await repository.saveBundle(
      providerConfigId,
      bundle,
      '2026-09-17T03:10:00Z',
    );

    await repository.saveAccumulations(runId, [
      {
        endUtc: '2026-09-17T02:30:00Z',
        windowSeconds: 3600,
        amountMm: 4,
        coverageRatio: 1,
        complete: true,
        derivationVersion: 'rainfall-accum-v1',
        inputRecordIds: ['rain:imerg:0130', 'rain:imerg:0200'],
        sourceIds: ['nasa-gpm-imerg'],
      },
    ]);

    const row = await pool.query<{
      window_seconds: number;
      amount_mm: number | string | null;
      coverage_ratio: number | string;
      input_record_ids: string[];
      source_ids: string[];
    }>(
      `SELECT window_seconds, amount_mm, coverage_ratio, input_record_ids, source_ids
       FROM rainfall_accumulations WHERE rainfall_run_id = $1`,
      [runId],
    );
    expect(row.rows[0]).toMatchObject({
      window_seconds: 3600,
      input_record_ids: ['rain:imerg:0130', 'rain:imerg:0200'],
      source_ids: ['nasa-gpm-imerg'],
    });
    expect(Number(row.rows[0]?.amount_mm)).toBe(4);
    expect(Number(row.rows[0]?.coverage_ratio)).toBe(1);

    await expect(
      repository.saveAccumulations(runId, [
        {
          endUtc: '2026-09-17T02:30:00Z',
          windowSeconds: 7200,
          amountMm: 4,
          coverageRatio: 1,
          complete: true,
          derivationVersion: 'rainfall-accum-v1',
          inputRecordIds: ['rain:imerg:0130', 'rain:imerg:0200'],
          sourceIds: ['nasa-gpm-imerg'],
        },
      ]),
    ).rejects.toThrow();
  });
});
