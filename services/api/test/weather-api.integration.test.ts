import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for weather API integration tests');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const client = new Client({ connectionString: databaseUrl, application_name: 'weather-api-integration' });
let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let providerId: string;

function assertNoInternalProviderFields(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of ['providerKey', 'secretRef', 'endpointConfig', 'fixture-weather-primary']) {
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

  const source = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('weather-public-fixture', 'Weather Public Fixture', 'fixture') RETURNING id`,
  );

  const provider = await client.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'weather-public-fixture', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ALLOWED', 'REVIEWED', 'Con Nước synthetic fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"maxAgeSeconds":900}'::jsonb,
       'HEALTHY', false
     ) RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  await client.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES
       ($1, 'weather.current', true),
       ($1, 'weather.hourlyForecast', true),
       ($1, 'weather.dailyForecast', true)`,
    [providerId],
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await client.end();
});

describe('public weather APIs', () => {
  it('serves normalized current/hourly/daily live fixture weather with route-specific cache headers', async () => {
    const current = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=19.51&lon=105.51',
    });
    expect(current.statusCode).toBe(200);
    expect(current.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=120');
    expect(current.json()).toMatchObject({
      freshness: { state: 'FRESH' },
      fallbackUsed: false,
      grid: { spatialRepresentation: 'GRID_CELL', latitude: 19.5, longitude: 105.5 },
      source: { sourceId: 'synthetic-weather-fixture', modelId: 'fixture-model' },
      data: { kind: 'MODEL_CURRENT', temperatureC: 29 },
    });
    assertNoInternalProviderFields(current.json());

    const hourly = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/hourly?lat=19.51&lon=105.51&hours=2',
    });
    expect(hourly.statusCode).toBe(200);
    expect(hourly.headers['cache-control']).toBe('public, max-age=300, stale-while-revalidate=600');
    expect(hourly.json().points).toHaveLength(2);
    expect(hourly.json()).toMatchObject({ freshness: { state: 'FRESH' }, fallbackUsed: false });
    assertNoInternalProviderFields(hourly.json());

    const daily = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/daily?lat=19.51&lon=105.51&days=2',
    });
    expect(daily.statusCode).toBe(200);
    expect(daily.headers['cache-control']).toBe('public, max-age=900, stale-while-revalidate=1800');
    expect(daily.json().points).toHaveLength(2);
    expect(daily.json()).toMatchObject({ freshness: { state: 'FRESH' }, fallbackUsed: false });
    assertNoInternalProviderFields(daily.json());
  });

  it('falls back to persisted nearest-grid cache as STALE when the live provider is disabled', async () => {
    await client.query(
      `UPDATE weather_forecast_runs
       SET stale_after = now() - interval '1 minute'
       WHERE provider_config_id = $1 AND capability = 'weather.current'`,
      [providerId],
    );
    await client.query('UPDATE provider_configs SET enabled = false WHERE id = $1', [providerId]);

    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=19.51&lon=105.51',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      grid: { latitude: 19.5, longitude: 105.5 },
      source: { sourceId: 'synthetic-weather-fixture' },
    });
    expect(response.json().grid.distanceFromRequestKm).toBeGreaterThan(0);
    assertNoInternalProviderFields(response.json());
  });

  it('returns a bounded 503 when no live provider or eligible cache exists', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/weather/current?lat=10&lon=110',
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      statusCode: 503,
      code: 'WEATHER_UNAVAILABLE',
      message: 'Weather data is temporarily unavailable.',
    });
  });

  it.each([
    '/v1/weather/current?lat=91&lon=105',
    '/v1/weather/current?lat=19&lon=181',
    '/v1/weather/hourly?lat=19&lon=105&hours=0',
    '/v1/weather/hourly?lat=19&lon=105&hours=169',
    '/v1/weather/daily?lat=19&lon=105&days=0',
    '/v1/weather/daily?lat=19&lon=105&days=16',
  ])('rejects invalid weather request %s', async (url) => {
    const response = await fastify.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(400);
  });
});
