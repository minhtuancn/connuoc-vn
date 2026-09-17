import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the Phase 5B weather gate');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const client = new Client({
  connectionString: databaseUrl,
  application_name: 'phase5b-weather-integration',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let allowedProviderId: string;

function assertNoProviderInternals(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerKey',
    'secretRef',
    'endpointConfig',
    'phase5b-blocked-preferred',
    'phase5b-allowed-fallback',
    'OPEN_METEO_API_KEY',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

beforeAll(async () => {
  await client.connect();
  await client.query(`TRUNCATE TABLE
    weather_current_points,
    weather_hourly_points,
    weather_daily_points,
    weather_forecast_runs,
    provider_health_events,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const blockedSource = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5b-blocked-source', 'Phase 5B blocked source', 'fixture')
     RETURNING id`,
  );
  const allowedSource = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5b-allowed-source', 'Phase 5B allowed source', 'fixture')
     RETURNING id`,
  );

  const blockedProvider = await client.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       secret_ref, commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'phase5b-blocked-preferred', $1, 'fixture', true, 200, 1,
       'env://OPEN_METEO_API_KEY', 'RESTRICTED', 'ALLOWED', 'REVIEWED',
       'Blocked fixture must never be selected',
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
       'phase5b-allowed-fallback', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ALLOWED', 'REVIEWED', 'Con Nước synthetic fixture',
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
         ($1, 'weather.current', true),
         ($1, 'weather.hourlyForecast', true),
         ($1, 'weather.dailyForecast', true)`,
      [providerId],
    );
  }

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await client.end();
});

describe('Phase 5B weather exit scenario', () => {
  it('uses an allowed fallback provider for normalized current, hourly and daily weather', async () => {
    const current = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=19.51&lon=105.51',
    });
    expect(current.statusCode).toBe(200);
    expect(current.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: true,
      grid: { spatialRepresentation: 'GRID_CELL', latitude: 19.5, longitude: 105.5 },
      source: { sourceId: 'synthetic-weather-fixture', modelId: 'fixture-model' },
      data: { kind: 'MODEL_CURRENT' },
    });
    assertNoProviderInternals(current.json());

    const hourly = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/hourly?lat=19.51&lon=105.51&hours=3',
    });
    expect(hourly.statusCode).toBe(200);
    expect(hourly.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: true,
    });
    expect(hourly.json().points).toHaveLength(3);
    assertNoProviderInternals(hourly.json());

    const daily = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/daily?lat=19.51&lon=105.51&days=3',
    });
    expect(daily.statusCode).toBe(200);
    expect(daily.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: true,
    });
    expect(daily.json().points).toHaveLength(3);
    assertNoProviderInternals(daily.json());
  });

  it('persists provider-grid weather and serves it as STALE only after live providers are unavailable', async () => {
    const persisted = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM weather_forecast_runs
       WHERE provider_config_id = $1`,
      [allowedProviderId],
    );
    expect(Number(persisted.rows[0]!.count)).toBeGreaterThanOrEqual(3);

    await client.query('UPDATE provider_configs SET enabled = false WHERE id = $1', [allowedProviderId]);

    const stale = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=19.51&lon=105.51',
    });
    expect(stale.statusCode).toBe(200);
    expect(stale.json()).toMatchObject({
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      grid: { latitude: 19.5, longitude: 105.5 },
      source: { sourceId: 'synthetic-weather-fixture' },
    });
    expect(stale.json().grid.distanceFromRequestKm).toBeGreaterThan(0);
    assertNoProviderInternals(stale.json());
  });

  it('fails closed with bounded WEATHER_UNAVAILABLE outside provider coverage and cache radius', async () => {
    const unavailable = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=10&lon=110',
    });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json()).toEqual({
      statusCode: 503,
      code: 'WEATHER_UNAVAILABLE',
      message: 'Weather data is temporarily unavailable.',
    });
    assertNoProviderInternals(unavailable.json());
  });
});
