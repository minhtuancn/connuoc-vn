import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the Phase 5D hydrology gate');
}

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'phase5d-hydrology-integration',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let allowedProviderId: string;

function assertSafeDischargePayload(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'providerConfigId',
    'providerKey',
    'secretRef',
    'endpointConfig',
    'phase5d-blocked-geoglows',
    'phase5d-allowed-fixture',
    'PHASE5D_BLOCKED_SECRET',
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

  const blockedSource = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5d-blocked-source', 'Phase 5D blocked source', 'fixture')
     RETURNING id`,
  );
  const allowedSource = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5d-allowed-source', 'Phase 5D allowed source', 'fixture')
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name, geometry)
     VALUES (
       'basin:phase5d',
       'Phase 5D Basin',
       ST_Multi(ST_GeomFromText('POLYGON((105.3 19.3,105.8 19.3,105.8 19.8,105.3 19.8,105.3 19.3))', 4326))
     )
     RETURNING id`,
  );
  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:phase5d',
       $1,
       'Phase 5D River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.45 19.45,105.65 19.65)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );
  const reach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:phase5d',
       $1,
       $2,
       'Phase 5D Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.495 19.495,105.515 19.515)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, allowedSource.rows[0]!.id],
  );
  const ambiguousReach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:phase5d:ambiguous',
       $1,
       $2,
       'Phase 5D Ambiguous Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.53 19.53,105.54 19.54)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, allowedSource.rows[0]!.id],
  );

  const blockedProvider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       secret_ref, commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state,
       health_blocks_selection
     ) VALUES (
       'phase5d-blocked-geoglows', $1, 'geoglows', true, 200, 1,
       'env://PHASE5D_BLOCKED_SECRET',
       'UNKNOWN', 'UNKNOWN', 'PRODUCT_SCOPE_CONFLICT_REVIEW_REQUIRED',
       'GEOGLOWS licence-review fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105.3 19.3,105.8 19.3,105.8 19.8,105.3 19.8,105.3 19.3))', 4326)),
       '{"maxAgeSeconds":3600}'::jsonb,
       'HEALTHY', false
     )
     RETURNING id`,
    [blockedSource.rows[0]!.id],
  );

  const allowedProvider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, health_state,
       health_blocks_selection
     ) VALUES (
       'phase5d-allowed-fixture', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED',
       'Con Nước Phase 5D synthetic hydrology fixture',
       ST_Multi(ST_GeomFromText('POLYGON((105.3 19.3,105.8 19.3,105.8 19.8,105.3 19.8,105.3 19.3))', 4326)),
       '{"maxAgeSeconds":3600}'::jsonb,
       'HEALTHY', false
     )
     RETURNING id`,
    [allowedSource.rows[0]!.id],
  );
  allowedProviderId = allowedProvider.rows[0]!.id;

  for (const providerId of [
    blockedProvider.rows[0]!.id,
    allowedProviderId,
  ]) {
    await pool.query(
      `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
       VALUES
         ($1, 'hydrology.dischargeForecast', true),
         ($1, 'hydrology.dischargeEnsemble', true),
         ($1, 'hydrology.retrospective', true),
         ($1, 'hydrology.returnPeriods', true)`,
      [providerId],
    );
  }

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES
       (
         $1, $2, '123456789', 'geoglows-v2', '2',
         'MAPPED', 'PROVIDER_ID', 0.50, NULL,
         '2026-09-01T00:00:00Z'
       ),
       (
         $1, $3, 'fixture-reach-001', 'fixture-hydrology', '1',
         'MAPPED', 'MANUAL', 0.99, 0.1,
         '2026-09-01T00:00:00Z'
       )`,
    [
      reach.rows[0]!.id,
      blockedProvider.rows[0]!.id,
      allowedProviderId,
    ],
  );

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES
       (
         $1, $2, 'fixture-reach-ambiguous-a', 'fixture-hydrology', '1',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.62, 0.4,
         '2026-09-01T00:00:00Z'
       ),
       (
         $1, $2, 'fixture-reach-ambiguous-b', 'fixture-hydrology', '1',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.60, 0.5,
         '2026-09-01T00:00:00Z'
       )`,
    [ambiguousReach.rows[0]!.id, allowedProviderId],
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Phase 5D river discharge exit scenario', () => {
  it('treats multiple valid provider mappings as coverage, not ambiguity', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/nearby?lat=19.5&lon=105.5&radiusKm=10&limit=10',
    });

    expect(response.statusCode).toBe(200);
    const selected = response
      .json()
      .reaches.find((item: { id: string }) => item.id === 'reach:phase5d');
    expect(selected).toMatchObject({
      id: 'reach:phase5d',
      mapping: {
        state: 'MAPPED',
        mappedProviderCount: 2,
        bestConfidence: 0.99,
      },
    });
    assertSafeDischargePayload(response.json());
  });

  it('skips commercial-unknown GEOGLOWS and uses the allowed mapped fallback', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5d/forecast?days=2',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      reachId: 'reach:phase5d',
      unit: 'm3/s',
      trend: 'RISING',
      freshness: { state: 'FRESH' },
      fallbackUsed: true,
      lastKnownGoodUsed: false,
      mapping: {
        state: 'MAPPED',
        providerReachId: 'fixture-reach-001',
        method: 'MANUAL',
        confidence: 0.99,
      },
    });
    expect(response.json().records.length).toBeGreaterThan(0);
    expect(response.json().returnPeriods.length).toBe(6);
    assertSafeDischargePayload(response.json());

    const persisted = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM hydrology_forecast_runs
       WHERE provider_config_id = $1
         AND capability = 'hydrology.dischargeForecast'`,
      [allowedProviderId],
    );
    expect(Number(persisted.rows[0]!.count)).toBeGreaterThanOrEqual(1);
  });

  it('uses compatible stale LKG after the allowed live provider is disabled', async () => {
    await pool.query(
      'UPDATE provider_configs SET enabled = false WHERE id = $1',
      [allowedProviderId],
    );

    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5d/forecast?days=2',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      unit: 'm3/s',
      freshness: { state: 'STALE' },
      fallbackUsed: true,
      lastKnownGoodUsed: true,
      mapping: {
        state: 'MAPPED',
        providerReachId: 'fixture-reach-001',
      },
    });
    assertSafeDischargePayload(response.json());
  });

  it('fails closed on ambiguous provider reach association', async () => {
    await pool.query(
      'UPDATE provider_configs SET enabled = true WHERE id = $1',
      [allowedProviderId],
    );

    const response = await fastify.inject({
      method: 'GET',
      url: '/v1/rivers/reach%3Aphase5d%3Aambiguous/forecast?days=1',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      statusCode: 503,
      code: 'HYDROLOGY_UNAVAILABLE',
      message: 'Hydrology data is temporarily unavailable.',
    });
    assertSafeDischargePayload(response.json());
  });
});
