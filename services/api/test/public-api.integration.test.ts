import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for public API integration tests');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const seedPool = new Pool({ connectionString: databaseUrl, application_name: 'public-api-integration-seed' });
let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;

async function seed(): Promise<void> {
  await seedPool.query(`TRUNCATE TABLE
    tide_constituents,
    tide_models,
    forecast_points,
    forecast_runs,
    quality_flags,
    observations,
    station_aliases,
    stations,
    source_import_runs,
    raw_payloads,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await seedPool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('public-api-fixture', 'Public API Fixture', 'fixture') RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;

  const raw = await seedPool.query<{ id: string }>(
    `INSERT INTO raw_payloads (
       source_id, payload_key, checksum_sha256, media_type, byte_length, captured_at
     ) VALUES ($1, 'public-api-fixture:2026-09-15', $2, 'application/json', 512,
       '2026-09-15T00:05:00Z') RETURNING id`,
    [sourceId, 'b'.repeat(64)],
  );
  const rawId = raw.rows[0]!.id;

  const importRun = await seedPool.query<{ id: string }>(
    `INSERT INTO source_import_runs (
       source_id, raw_payload_id, idempotency_key, parser_version, normalizer_version,
       status, started_at, finished_at, accepted_records, rejected_records
     ) VALUES ($1, $2, 'public-api-fixture-import', 'fixture-parser@1',
       'fixture-normalizer@1', 'SUCCEEDED', '2026-09-15T00:05:00Z',
       '2026-09-15T00:05:01Z', 2, 0) RETURNING id`,
    [sourceId, rawId],
  );
  const importRunId = importRun.rows[0]!.id;

  const station = await seedPool.query<{ id: string }>(
    `INSERT INTO stations (
       public_id, name, station_type, time_zone, location, default_datum_id
     ) VALUES (
       'public-api-station', 'Public API Fixture Station', 'multi', 'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(106.08, 20.25), 4326), 'local-gauge-fixture'
     ) RETURNING id`,
  );
  const stationId = station.rows[0]!.id;

  await seedPool.query(
    `INSERT INTO station_aliases (station_id, alias, normalized_alias, source_id)
     VALUES ($1, 'Tram thu nghiem', 'tram thu nghiem', $2)`,
    [stationId, sourceId],
  );

  await seedPool.query(
    `INSERT INTO observations (
       station_id, source_id, import_run_id, raw_payload_id, source_record_key,
       observed_at, value, unit, datum_id, quality_state
     ) VALUES
       ($1, $2, $3, $4, 'public-api-obs-2', '2026-09-15T01:00:00Z', 130.2, 'cm',
        'local-gauge-fixture', 'GOOD'),
       ($1, $2, $3, $4, 'public-api-obs-1', '2026-09-15T00:00:00Z', 123.4, 'cm',
        'local-gauge-fixture', 'GOOD')`,
    [stationId, sourceId, importRunId, rawId],
  );

  const tideModel = await seedPool.query<{ id: string }>(
    `INSERT INTO tide_models (
       station_id, source_id, import_run_id, model_id, model_version, datum_id, unit,
       mean_level, reference_epoch, phase_convention
     ) VALUES ($1, $2, $3, 'public-api-harmonic', '1.0.0', 'local-gauge-fixture', 'm',
       1.0, '2026-01-01T00:00:00Z', 'cosine_lag_degrees') RETURNING id`,
    [stationId, sourceId, importRunId],
  );

  await seedPool.query(
    `INSERT INTO tide_constituents (
       tide_model_id, name, amplitude, phase_degrees, speed_degrees_per_hour, ordinal
     ) VALUES ($1, 'M2', 0.5, 0, 28.9841042, 0)`,
    [tideModel.rows[0]!.id],
  );
}

beforeAll(async () => {
  await seed();
  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await seedPool.end();
});

describe('Phase 2 public API against PostGIS', () => {
  it('searches stations and aliases with deterministic cache metadata', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/v1/locations/search?q=Fixture' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300, stale-while-revalidate=600');
    expect(response.json()).toMatchObject({
      items: [{ id: 'public-api-station', name: 'Public API Fixture Station' }],
      meta: { nextCursor: null },
    });
  });

  it('returns station and observed water levels with complete ingestion provenance', async () => {
    const station = await fastify.inject({ method: 'GET', url: '/v1/stations/public-api-station' });
    expect(station.statusCode).toBe(200);
    expect(station.json()).toMatchObject({
      id: 'public-api-station',
      defaultDatumId: 'local-gauge-fixture',
      provenance: {
        sourceKey: 'public-api-fixture',
        rawChecksumSha256: 'b'.repeat(64),
        parserVersion: 'fixture-parser@1',
        normalizerVersion: 'fixture-normalizer@1',
        observedAt: '2026-09-15T01:00:00.000Z',
      },
    });

    const water = await fastify.inject({
      method: 'GET',
      url: '/v1/stations/public-api-station/water-level?limit=1',
    });
    expect(water.statusCode).toBe(200);
    expect(water.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=120');
    const body = water.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      observedAt: '2026-09-15T01:00:00.000Z',
      value: 130.2,
      unit: 'cm',
      datumId: 'local-gauge-fixture',
      provenance: { sourceKey: 'public-api-fixture', importRunId: expect.any(String) },
    });
    expect(body.meta.nextCursor).toEqual(expect.any(String));
  });

  it('calculates tide through the deterministic engine and exposes model provenance', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/stations/public-api-station/tide?start=2026-01-01T00%3A00%3A00.000Z&end=2026-01-01T02%3A00%3A00.000Z&intervalSeconds=3600',
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300, stale-while-revalidate=900');
    const body = response.json();
    expect(body.points).toHaveLength(3);
    expect(body.points[0].value).toBeCloseTo(1.5, 10);
    expect(body.meta).toMatchObject({
      modelId: 'public-api-harmonic',
      modelVersion: '1.0.0',
      datumId: 'local-gauge-fixture',
      unit: 'm',
      timeZone: 'Asia/Ho_Chi_Minh',
      provenance: { sourceKey: 'public-api-fixture', importRunId: expect.any(String) },
    });
  });

  it('delegates calendar conversion and returns problem details for invalid/unknown requests', async () => {
    const calendar = await fastify.inject({ method: 'GET', url: '/v1/calendar?date=2024-02-10' });
    expect(calendar.statusCode).toBe(200);
    expect(calendar.json()).toMatchObject({
      solarDate: { year: 2024, month: 2, day: 10 },
      lunarDate: { year: 2024, month: 1, day: 1, isLeapMonth: false },
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    const invalidRange = await fastify.inject({
      method: 'GET',
      url: '/v1/stations/public-api-station/tide?start=2026-01-02T00%3A00%3A00Z&end=2026-01-01T00%3A00%3A00Z',
    });
    expect(invalidRange.statusCode).toBe(400);
    expect(invalidRange.headers['content-type']).toContain('application/problem+json');

    const missing = await fastify.inject({ method: 'GET', url: '/v1/stations/missing-station' });
    expect(missing.statusCode).toBe(404);
    expect(missing.headers['content-type']).toContain('application/problem+json');
  });
});
