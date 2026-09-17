import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WeatherRepository } from '../src/modules/weather/weather.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for weather repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'weather-repository-integration',
});

let repository: WeatherRepository;
let providerConfigId: string;

const currentBundle = {
  capability: 'weather.current',
  grid: {
    spatialRepresentation: 'GRID_CELL',
    latitude: 19.5,
    longitude: 105.5,
    timeZone: 'UTC',
    distanceFromRequestKm: null,
  },
  source: {
    sourceId: 'synthetic-weather-fixture',
    attributionText: 'Con Nước synthetic fixture',
    attributionUrl: null,
    modelId: 'fixture-model',
    modelRunAt: '2026-09-17T00:00:00Z',
    fetchedAt: '2026-09-17T02:01:00Z',
  },
  data: {
    kind: 'MODEL_CURRENT',
    validAt: '2026-09-17T02:00:00Z',
    temperatureC: 29,
    apparentTemperatureC: 31,
    relativeHumidityPct: 80,
    pressureHpa: 1008,
    windSpeedMs: 2.2,
    windGustMs: 4.1,
    windDirectionDeg: 110,
    cloudCoverPct: 65,
    weatherCode: 3,
    visibilityM: 10_000,
    uvIndex: 2,
    precipitationMm: 0,
    rainMm: 0,
  },
} as const;

async function seed(): Promise<void> {
  await pool.query(`TRUNCATE TABLE
    weather_current_points,
    weather_hourly_points,
    weather_daily_points,
    weather_forecast_runs,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('weather-cache-fixture', 'Weather Cache Fixture', 'fixture') RETURNING id`,
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status, health_state
     ) VALUES (
       'weather-cache-fixture', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED', 'HEALTHY'
     ) RETURNING id`,
    [source.rows[0]!.id],
  );

  providerConfigId = provider.rows[0]!.id;
}

beforeAll(async () => {
  await seed();
  repository = new WeatherRepository(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('weather forecast cache repository', () => {
  it('saves an identical normalized bundle idempotently without persisting request coordinates', async () => {
    const firstId = await repository.saveBundle(providerConfigId, currentBundle, 900);
    const secondId = await repository.saveBundle(providerConfigId, currentBundle, 900);

    expect(secondId).toBe(firstId);

    const runCount = await pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM weather_forecast_runs',
    );
    const pointCount = await pool.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM weather_current_points',
    );
    expect(runCount.rows[0]?.count).toBe(1);
    expect(pointCount.rows[0]?.count).toBe(1);

    const columns = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'weather_forecast_runs'`,
    );
    const names = columns.rows.map((row) => row.column_name);
    expect(names).not.toContain('request_latitude');
    expect(names).not.toContain('request_longitude');
  });

  it('returns the nearest eligible provider grid with fresh/stale state and rejects grids beyond 25 km', async () => {
    await repository.saveBundle(providerConfigId, currentBundle, 900);

    const fresh = await repository.findNearestCached(
      'weather.current',
      { latitude: 19.51, longitude: 105.51 },
      25,
      new Date('2026-09-17T02:05:00Z'),
    );

    expect(fresh).not.toBeNull();
    expect(fresh?.freshness).toEqual({
      state: 'FRESH',
      staleAfter: '2026-09-17T02:16:00Z',
    });
    expect(fresh?.bundle.capability).toBe('weather.current');
    expect(fresh?.bundle.grid).toMatchObject({
      spatialRepresentation: 'GRID_CELL',
      latitude: 19.5,
      longitude: 105.5,
      timeZone: 'UTC',
    });
    expect(fresh?.bundle.grid.distanceFromRequestKm).toBeGreaterThan(0);
    expect(fresh?.bundle.source.sourceId).toBe('synthetic-weather-fixture');
    expect(JSON.stringify(fresh)).not.toContain('weather-cache-fixture');

    const stale = await repository.findNearestCached(
      'weather.current',
      { latitude: 19.51, longitude: 105.51 },
      25,
      new Date('2026-09-17T02:30:00Z'),
    );
    expect(stale?.freshness.state).toBe('STALE');

    await expect(
      repository.findNearestCached(
        'weather.current',
        { latitude: 20.5, longitude: 106.5 },
        25,
        new Date('2026-09-17T02:05:00Z'),
      ),
    ).resolves.toBeNull();
  });
});
