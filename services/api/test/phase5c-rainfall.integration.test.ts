import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { NormalizedRainfallBundle } from '@connuoc/weather-worker';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { RainfallRepository } from '../src/modules/rainfall/rainfall.repository.js';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the Phase 5C rainfall gate');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const client = new Client({
  connectionString: databaseUrl,
  application_name: 'phase5c-rainfall-integration',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let allowedProviderId: string;

const satelliteBundle: NormalizedRainfallBundle = {
  capability: 'rainfall.satellite',
  records: [
    {
      id: 'phase5c:satellite:2026-09-17T03:00:00Z',
      productKind: 'SATELLITE_ESTIMATE',
      validStart: '2026-09-17T02:30:00Z',
      validEnd: '2026-09-17T03:00:00Z',
      accumulationSeconds: 1800,
      amountMm: 2.4,
      unit: 'mm',
      spatial: {
        representation: 'GRID_CELL',
        latitude: 19.5,
        longitude: 105.5,
        resolutionKm: 10,
        stationId: null,
      },
      quality: { state: 'ESTIMATED', flags: ['PHASE5C_FIXTURE'] },
      source: {
        sourceId: 'phase5c-allowed-source',
        providerConfigId: null,
        productId: 'phase5c-satellite-product',
        productVersion: '1',
        modelRunAt: null,
        observedAt: '2026-09-17T03:00:00Z',
        fetchedAt: '2026-09-17T03:01:00Z',
        attributionText: 'Con Nước Phase 5C synthetic rainfall fixture',
        attributionUrl: null,
      },
    },
  ],
};

function assertSafePublicRainfall(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerConfigId',
    'providerKey',
    'secretRef',
    'endpointConfig',
    'phase5c-blocked-preferred',
    'phase5c-allowed-fallback',
    'PHASE5C_PROVIDER_SECRET',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
  const lower = serialized.toLowerCase();
  expect(lower).not.toContain('riverstage');
  expect(lower).not.toContain('floodrisk');
  expect(lower).not.toContain('floodprobability');
}

beforeAll(async () => {
  await client.connect();
  await client.query(`TRUNCATE TABLE
    rainfall_accumulations,
    rainfall_records,
    rainfall_runs,
    provider_health_events,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const blockedSource = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5c-blocked-source', 'Phase 5C blocked source', 'fixture')
     RETURNING id`,
  );
  const allowedSource = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5c-allowed-source', 'Phase 5C allowed source', 'fixture')
     RETURNING id`,
  );

  const blockedProvider = await client.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       secret_ref, commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'phase5c-blocked-preferred', $1, 'fixture', true, 200, 1,
       'env://PHASE5C_PROVIDER_SECRET', 'RESTRICTED', 'ALLOWED', 'REVIEWED',
       'Blocked rainfall fixture must never be selected',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"maxAgeSeconds":900}'::jsonb,
       'HEALTHY', false
     ) RETURNING id`,
    [blockedSource.rows[0]!.id],
  );
  const allowedProvider = await client.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'phase5c-allowed-fallback', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ALLOWED', 'REVIEWED',
       'Con Nước Phase 5C synthetic rainfall fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"maxAgeSeconds":900}'::jsonb,
       'HEALTHY', false
     ) RETURNING id`,
    [allowedSource.rows[0]!.id],
  );
  allowedProviderId = allowedProvider.rows[0]!.id;

  for (const providerId of [blockedProvider.rows[0]!.id, allowedProviderId]) {
    await client.query(
      `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
       VALUES
         ($1, 'rainfall.observed', true),
         ($1, 'rainfall.satellite', true),
         ($1, 'rainfall.forecast', true)`,
      [providerId],
    );
  }

  await new RainfallRepository(client as never).saveBundle(
    allowedProviderId,
    satelliteBundle,
    '2026-09-17T04:01:00Z',
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await client.end();
});

describe('Phase 5C rainfall exit scenario', () => {
  it('keeps satellite estimates explicit in history and derived accumulation output', async () => {
    const history = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/history?lat=19.51&lon=105.51&start=2026-09-17T02:00:00Z&end=2026-09-17T03:30:00Z&limit=50',
    });
    expect(history.statusCode).toBe(200);
    expect(history.json()).toMatchObject({
      records: [
        {
          productKind: 'SATELLITE_ESTIMATE',
          amountMm: 2.4,
          spatial: { representation: 'GRID_CELL', resolutionKm: 10, stationId: null },
          source: { sourceId: 'phase5c-allowed-source' },
        },
      ],
    });
    assertSafePublicRainfall(history.json());

    const summary = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/summary?lat=19.51&lon=105.51&at=2026-09-17T03:00:00Z',
    });
    expect(summary.statusCode).toBe(200);
    expect(summary.json()).toMatchObject({
      at: '2026-09-17T03:00:00Z',
      windows: [
        {
          windowSeconds: 3600,
          amountMm: 2.4,
          coverageRatio: 0.5,
          complete: false,
          productKinds: ['SATELLITE_ESTIMATE'],
          sourceIds: ['phase5c-allowed-source'],
          derivationVersion: 'rainfall-accum-v1',
        },
      ],
    });
    assertSafePublicRainfall(summary.json());
  });

  it('selects an allowed forecast provider, persists live data and preserves nearest LKG', async () => {
    const live = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=19.51&lon=105.51&hours=3',
    });
    expect(live.statusCode).toBe(200);
    expect(live.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: true,
      lastKnownGoodUsed: false,
    });
    expect(live.json().records).toHaveLength(3);
    expect(live.json().records[0]).toMatchObject({
      productKind: 'DETERMINISTIC_FORECAST',
    });
    assertSafePublicRainfall(live.json());

    const persisted = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM rainfall_runs
       WHERE provider_config_id = $1 AND capability = 'rainfall.forecast'`,
      [allowedProviderId],
    );
    expect(Number(persisted.rows[0]!.count)).toBeGreaterThanOrEqual(1);

    await client.query('UPDATE provider_configs SET enabled = false WHERE id = $1', [
      allowedProviderId,
    ]);

    const cached = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=19.51&lon=105.51&hours=3',
    });
    expect(cached.statusCode).toBe(200);
    expect(cached.json()).toMatchObject({
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      lastKnownGoodUsed: true,
    });
    expect(cached.json().records).toHaveLength(3);
    assertSafePublicRainfall(cached.json());
  });

  it('fails closed outside provider coverage and the bounded LKG radius', async () => {
    const unavailable = await fastify.inject({
      method: 'GET',
      url: '/v1/rainfall/forecast?lat=10&lon=110&hours=3',
    });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json()).toEqual({
      statusCode: 503,
      code: 'RAINFALL_UNAVAILABLE',
      message: 'Rainfall data is temporarily unavailable.',
    });
    assertSafePublicRainfall(unavailable.json());
  });
});
