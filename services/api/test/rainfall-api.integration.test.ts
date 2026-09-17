import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { NormalizedRainfallBundle } from '@connuoc/weather-worker';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { RainfallRepository } from '../src/modules/rainfall/rainfall.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for rainfall API integration tests');

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const pool = new Pool({ connectionString: databaseUrl, application_name: 'rainfall-api-integration' });
let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let providerId: string;

const historicalBundle: NormalizedRainfallBundle = {
  capability: 'rainfall.observed',
  records: [
    {
      id: 'rain:fixture:gauge:2026-09-17T03:00:00Z',
      productKind: 'GAUGE_OBSERVATION',
      validStart: '2026-09-17T02:30:00Z',
      validEnd: '2026-09-17T03:00:00Z',
      accumulationSeconds: 1800,
      amountMm: 1.8,
      unit: 'mm',
      spatial: {
        representation: 'GAUGE',
        latitude: 19.5,
        longitude: 105.5,
        resolutionKm: null,
        stationId: 'station:public-rainfall-fixture',
      },
      quality: { state: 'VALID', flags: ['FIXTURE'] },
      source: {
        sourceId: 'rainfall-public-fixture',
        providerConfigId: null,
        productId: 'fixture-gauge-observation',
        productVersion: '1',
        modelRunAt: null,
        observedAt: '2026-09-17T03:00:00Z',
        fetchedAt: '2026-09-17T03:01:00Z',
        attributionText: 'Con Nước synthetic rainfall fixture',
        attributionUrl: null,
      },
    },
  ],
};

function assertPublicRainfallPayload(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerConfigId',
    'providerKey',
    'secretRef',
    'endpointConfig',
    'rainfall-public-fixture-provider-key',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
  expect(serialized.toLowerCase()).not.toContain('riverstage');
  expect(serialized.toLowerCase()).not.toContain('floodrisk');
  expect(serialized.toLowerCase()).not.toContain('floodprobability');
}

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE
    rainfall_accumulations,
    rainfall_records,
    rainfall_runs,
    provider_health_events,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('rainfall-public-fixture', 'Rainfall Public Fixture', 'fixture') RETURNING id`,
  );
  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'rainfall-public-fixture-provider-key', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ALLOWED', 'REVIEWED', 'Con Nước synthetic rainfall fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"maxAgeSeconds":900}'::jsonb,
       'HEALTHY', false
     ) RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES
       ($1, 'rainfall.observed', true),
       ($1, 'rainfall.satellite', true),
       ($1, 'rainfall.forecast', true)`,
    [providerId],
  );

  await new RainfallRepository(pool).saveBundle(
    providerId,
    historicalBundle,
    '2026-09-17T04:01:00Z',
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('public rainfall APIs', () => {
  it('serves persisted normalized history without relabeling estimates or exposing provider internals', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/history?lat=19.51&lon=105.51&start=2026-09-17T02:00:00Z&end=2026-09-17T03:30:00Z&limit=50',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      records: [
        {
          productKind: 'GAUGE_OBSERVATION',
          amountMm: 1.8,
          spatial: { representation: 'GAUGE', stationId: 'station:public-rainfall-fixture' },
          source: { sourceId: 'rainfall-public-fixture' },
        },
      ],
    });
    assertPublicRainfallPayload(response.json());
  });

  it('derives explicit partial accumulation windows for summary', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/summary?lat=19.51&lon=105.51&at=2026-09-17T03:00:00Z',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      at: '2026-09-17T03:00:00Z',
      windows: [
        {
          windowSeconds: 3600,
          amountMm: 1.8,
          coverageRatio: 0.5,
          complete: false,
          derivationVersion: 'rainfall-accum-v1',
          productKinds: ['GAUGE_OBSERVATION'],
          sourceIds: ['rainfall-public-fixture'],
        },
      ],
    });
    assertPublicRainfallPayload(response.json());
  });

  it('serves live forecast, persists it, then uses nearest LKG when the provider is disabled', async () => {
    const live = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=19.51&lon=105.51&hours=2',
    });
    expect(live.statusCode).toBe(200);
    expect(live.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: false,
      lastKnownGoodUsed: false,
    });
    expect(live.json().records).toHaveLength(2);
    expect(live.json().records[0]).toMatchObject({ productKind: 'DETERMINISTIC_FORECAST' });
    assertPublicRainfallPayload(live.json());

    await pool.query('UPDATE provider_configs SET enabled = false WHERE id = $1', [providerId]);

    const cached = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=19.51&lon=105.51&hours=2',
    });
    expect(cached.statusCode).toBe(200);
    expect(cached.json()).toMatchObject({
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      lastKnownGoodUsed: true,
    });
    expect(cached.json().records).toHaveLength(2);
    assertPublicRainfallPayload(cached.json());
  });

  it('returns bounded 503 when no eligible live provider or LKG exists', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=10&lon=110&hours=2',
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      statusCode: 503,
      code: 'RAINFALL_UNAVAILABLE',
      message: 'Rainfall data is temporarily unavailable.',
    });
  });

  it.each([
    '/v1/rainfall/summary?lat=91&lon=105&at=2026-09-17T03:00:00Z',
    '/v1/rainfall/summary?lat=19&lon=181&at=2026-09-17T03:00:00Z',
    '/v1/rainfall/history?lat=19&lon=105&start=2026-09-17T04:00:00Z&end=2026-09-17T03:00:00Z&limit=10',
    '/v1/rainfall/history?lat=19&lon=105&start=2026-09-17T02:00:00Z&end=2026-09-17T03:00:00Z&limit=0',
    '/v1/rainfall/forecast?lat=19&lon=105&hours=0',
    '/v1/rainfall/forecast?lat=19&lon=105&hours=169',
  ])('rejects invalid rainfall request %s', async (url) => {
    const response = await fastify.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(400);
  });
});
