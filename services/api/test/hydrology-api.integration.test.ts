import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for hydrology API integration tests');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'hydrology-api-integration',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let providerId: string;

function assertSafeHydrologyPayload(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerConfigId',
    'providerKey',
    'secretRef',
    'endpointConfig',
    'hydrology-public-provider-key',
    'stageM',
    'waterLevelM',
    'waterLevel',
    'riverStage',
    'floodProbability',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE
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
     VALUES ('hydrology-public-fixture', 'Hydrology Public Fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name, geometry)
     VALUES (
       'basin:hydrology-public',
       'Hydrology Public Basin',
       ST_Multi(ST_GeomFromText('POLYGON((105.4 19.4,105.7 19.4,105.7 19.7,105.4 19.7,105.4 19.4))', 4326))
     )
     RETURNING id`,
  );

  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:hydrology-public',
       $1,
       'Hydrology Public River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.48 19.48,105.58 19.58)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const reach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:hydrology-public',
       $1,
       $2,
       'Hydrology Public Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.495 19.495,105.515 19.515)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );

  const ambiguousReach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:hydrology-ambiguous',
       $1,
       $2,
       'Hydrology Ambiguous Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.525 19.525,105.535 19.535)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state,
       health_blocks_selection
     ) VALUES (
       'hydrology-public-provider-key', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED',
       'Con Nước synthetic hydrology fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105.4 19.4,105.7 19.4,105.7 19.7,105.4 19.7,105.4 19.4))', 4326)),
       '{"maxAgeSeconds":3600}'::jsonb,
       'HEALTHY', false
     )
     RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES
       ($1, 'hydrology.dischargeForecast', true),
       ($1, 'hydrology.dischargeEnsemble', true),
       ($1, 'hydrology.retrospective', true),
       ($1, 'hydrology.returnPeriods', true)`,
    [providerId],
  );

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES (
       $1, $2, '777777777', 'fixture-hydrology', '1',
       'MAPPED', 'MANUAL', 0.99, 0.1,
       '2026-09-01T00:00:00Z'
     )`,
    [reach.rows[0]!.id, providerId],
  );

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES
       (
         $1, $2, '888888881', 'fixture-hydrology', '1',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.62, 0.4,
         '2026-09-01T00:00:00Z'
       ),
       (
         $1, $2, '888888882', 'fixture-hydrology', '1',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.60, 0.5,
         '2026-09-01T00:00:00Z'
       )`,
    [ambiguousReach.rows[0]!.id, providerId],
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('public river/hydrology APIs', () => {
  it('lists nearby normalized reaches with mapping uncertainty but no provider internals', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/nearby?lat=19.5&lon=105.5&radiusKm=10&limit=10',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reaches: [
        {
          id: 'reach:hydrology-public',
          name: 'Hydrology Public Reach',
          riverId: 'river:hydrology-public',
          basinId: 'basin:hydrology-public',
          mapping: {
            state: 'MAPPED',
            bestConfidence: 0.99,
          },
        },
        {
          id: 'reach:hydrology-ambiguous',
          mapping: {
            state: 'AMBIGUOUS',
            bestConfidence: 0.62,
          },
        },
      ],
    });
    assertSafeHydrologyPayload(response.json());
  });

  it('serves discharge forecast, trend and return-period context without fabricated stage', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Ahydrology-public/forecast?days=2',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reachId: 'reach:hydrology-public',
      unit: 'm3/s',
      trend: 'RISING',
      freshness: { state: 'FRESH' },
      fallbackUsed: false,
      lastKnownGoodUsed: false,
      mapping: {
        state: 'MAPPED',
        method: 'MANUAL',
        confidence: 0.99,
      },
    });
    expect(response.json().records.length).toBeGreaterThan(0);
    expect(response.json().records[0]).toMatchObject({
      productKind: 'FORECAST_MEAN',
      unit: 'm3/s',
      source: { sourceId: 'hydrology-public-fixture' },
    });
    expect(response.json().returnPeriods.map((item: { returnPeriodYears: number }) => item.returnPeriodYears)).toEqual([
      2, 5, 10, 20, 50, 100,
    ]);
    assertSafeHydrologyPayload(response.json());
  });

  it('persists live forecast and return-period context, then serves compatible LKG when provider is disabled', async () => {
    const live = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Ahydrology-public/forecast?days=1',
    });
    expect(live.statusCode).toBe(200);
    expect(live.json().freshness.state).toBe('FRESH');

    await pool.query(
      'UPDATE provider_configs SET enabled = false WHERE id = $1',
      [providerId],
    );

    const cached = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Ahydrology-public/forecast?days=1',
    });
    expect(cached.statusCode).toBe(200);
    expect(cached.json()).toMatchObject({
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      lastKnownGoodUsed: true,
      unit: 'm3/s',
    });
    assertSafeHydrologyPayload(cached.json());
  });

  it('fails closed for an ambiguous reach instead of selecting a provider reach', async () => {
    await pool.query(
      'UPDATE provider_configs SET enabled = true WHERE id = $1',
      [providerId],
    );

    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Ahydrology-ambiguous/forecast?days=1',
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      statusCode: 503,
      code: 'HYDROLOGY_UNAVAILABLE',
      message: 'Hydrology data is temporarily unavailable.',
    });
  });

  it.each([
    '/v1/rivers/nearby?lat=91&lon=105&radiusKm=10&limit=10',
    '/v1/rivers/nearby?lat=19&lon=181&radiusKm=10&limit=10',
    '/v1/rivers/nearby?lat=19&lon=105&radiusKm=0&limit=10',
    '/v1/rivers/nearby?lat=19&lon=105&radiusKm=10&limit=0',
    '/v1/rivers/reach%3Ahydrology-public/forecast?days=0',
    '/v1/rivers/reach%3Ahydrology-public/forecast?days=31',
  ])('rejects invalid hydrology request %s', async (url) => {
    const response = await fastify.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(400);
  });
});
