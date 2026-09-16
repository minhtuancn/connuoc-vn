import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { selectProvider, type SelectableProviderConfig } from '../../weather-worker/src/provider-selector.js';
import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { hashAdminBearerToken } from '../src/modules/admin/admin-auth.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for Phase 5A provider-foundation integration tests');

const operatorToken = 'phase5a-operator-token-0123456789-abcdef-XYZ';
const canarySecretRef = 'vault://PHASE5A-CANARY-SECRET-DO-NOT-EXPOSE';
const latitude = 19.5;
const longitude = 105.5;
const pool = new Pool({ connectionString: databaseUrl, application_name: 'phase5a-provider-foundation' });
const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

function providerPayload(priority: number) {
  return {
    providerType: 'fixture-weather',
    enabled: true,
    priority,
    weight: 1,
    secretRef: canarySecretRef,
    endpointConfig: { baseUrl: 'https://fallback.example.test', timeoutMs: 10_000 },
    commercialUseStatus: 'ALLOWED',
    redistributionStatus: 'ATTRIBUTION_REQUIRED',
    licenceStatus: 'REVIEWED',
    attributionText: 'Phase 5A fixture attribution',
    attributionUrl: 'https://fallback.example.test/terms',
    coverageGeoJson: {
      type: 'MultiPolygon',
      coordinates: [[[[105, 19], [106, 19], [106, 20], [105, 20], [105, 19]]]],
    },
    quotaPolicy: { requestsPerDay: 10_000, blockWhenExhausted: true },
    budgetPolicy: { monthlyUsd: 100, blockWhenExceeded: true },
    freshnessPolicy: { maxAgeSeconds: 3600 },
    modelAllowList: ['fixture-model'],
    fallbackGroup: 'weather-default',
    healthState: 'HEALTHY',
    healthBlocksSelection: true,
    capabilities: ['weather.hourlyForecast'],
    metadata: { phase: '5A', reviewed: true },
  };
}

async function loadCandidates(): Promise<SelectableProviderConfig[]> {
  const result = await pool.query<{
    providerId: string;
    providerKey: string;
    enabled: boolean;
    priority: number;
    weight: number;
    commercialUseStatus: SelectableProviderConfig['commercialUseStatus'];
    healthState: SelectableProviderConfig['healthState'];
    healthBlocksSelection: boolean;
    coversLocation: boolean;
    capabilities: SelectableProviderConfig['capabilities'];
  }>(
    `SELECT
       pc.id::text AS "providerId",
       pc.provider_key AS "providerKey",
       pc.enabled,
       pc.priority,
       pc.weight::float8 AS weight,
       pc.commercial_use_status AS "commercialUseStatus",
       pc.health_state AS "healthState",
       pc.health_blocks_selection AS "healthBlocksSelection",
       CASE WHEN pc.coverage IS NULL THEN true
         ELSE ST_Covers(pc.coverage, ST_SetSRID(ST_MakePoint($2::float8, $1::float8), 4326))
       END AS "coversLocation",
       COALESCE(
         array_agg(cap.capability ORDER BY cap.capability) FILTER (WHERE cap.enabled),
         ARRAY[]::text[]
       ) AS capabilities
     FROM provider_configs pc
     LEFT JOIN provider_capabilities cap ON cap.provider_config_id = pc.id
     GROUP BY pc.id
     ORDER BY pc.provider_key`,
    [latitude, longitude],
  );

  return result.rows.map((row) => ({
    ...row,
    quotaAvailable: true,
    budgetAvailable: true,
    effectiveFromUtc: null,
    effectiveToUtc: null,
  }));
}

async function selectCommercialWeather() {
  return selectProvider(await loadCandidates(), {
    capability: 'weather.hourlyForecast',
    location: { latitude, longitude },
    atUtc: '2026-09-17T00:00:00Z',
    deploymentUse: 'COMMERCIAL',
  });
}

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE
    admin_api_tokens,
    admin_principals,
    audit_log,
    provider_health_events,
    provider_capabilities,
    provider_configs,
    administrative_area_successors,
    administrative_area_aliases,
    administrative_areas,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('phase5a-fixture', 'Phase 5A Fixture', 'fixture') RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;

  const province = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:phase5a:province', '37', 'Tỉnh Ninh Bình', 'tinh ninh binh', 'PROVINCE',
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,107 19,107 21,105 21,105 19))', 4326)), $1
     ) RETURNING id`,
    [sourceId],
  );

  const commune = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind, parent_id,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:phase5a:commune', '37001', 'Xã Nghĩa Phong', 'xa nghia phong', 'COMMUNE', $1,
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)), $2
     ) RETURNING id`,
    [province.rows[0]!.id, sourceId],
  );

  const historical = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, effective_to, is_current, geometry_source_id
     ) VALUES (
       'area:phase5a:legacy-district', 'LEGACY-NH', 'Huyện Nghĩa Hưng', 'huyen nghia hung',
       'HISTORICAL_DISTRICT', DATE '1997-01-01', DATE '2025-06-30', false, $1
     ) RETURNING id`,
    [sourceId],
  );

  await pool.query(
    `INSERT INTO administrative_area_aliases (
       area_id, alias, normalized_alias, alias_kind, effective_to, source_id
     ) VALUES ($1, 'Nghĩa Hưng cũ', 'nghia hung cu', 'LEGACY_DISTRICT', DATE '2025-06-30', $2)`,
    [historical.rows[0]!.id, sourceId],
  );
  await pool.query(
    `INSERT INTO administrative_area_successors (
       predecessor_area_id, successor_area_id, relationship, effective_at, source_id
     ) VALUES ($1, $2, 'REORGANIZED_TO', DATE '2025-07-01', $3)`,
    [historical.rows[0]!.id, commune.rows[0]!.id, sourceId],
  );

  const operator = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('phase5a-operator', 'Phase 5A Operator', 'data-operator') RETURNING id`,
  );
  await pool.query(
    `INSERT INTO admin_api_tokens (principal_id, token_hash_sha256, label)
     VALUES ($1, $2, 'phase5a-runtime')`,
    [operator.rows[0]!.id, hashAdminBearerToken(operatorToken)],
  );

  const preferred = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, provider_type, enabled, priority, weight, commercial_use_status,
       redistribution_status, licence_status, coverage, health_state, health_blocks_selection,
       fallback_group, metadata
     ) VALUES (
       'fixture-preferred-restricted', 'fixture-weather', true, 200, 1, 'RESTRICTED',
       'ATTRIBUTION_REQUIRED', 'REVIEWED',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       'HEALTHY', true, 'weather-default', '{"phase":"5A"}'::jsonb
     ) RETURNING id`,
  );
  const fallback = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, provider_type, enabled, priority, weight, secret_ref, endpoint_config,
       commercial_use_status, redistribution_status, licence_status, attribution_text,
       attribution_url, coverage, quota_policy, budget_policy, freshness_policy,
       model_allow_list, fallback_group, health_state, health_blocks_selection, metadata
     ) VALUES (
       'fixture-fallback-allowed', 'fixture-weather', true, 100, 1, $1,
       '{"baseUrl":"https://fallback.example.test","timeoutMs":10000}'::jsonb,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED', 'Phase 5A fixture attribution',
       'https://fallback.example.test/terms',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"requestsPerDay":10000,"blockWhenExhausted":true}'::jsonb,
       '{"monthlyUsd":100,"blockWhenExceeded":true}'::jsonb,
       '{"maxAgeSeconds":3600}'::jsonb,
       '["fixture-model"]'::jsonb, 'weather-default', 'HEALTHY', true,
       '{"phase":"5A","reviewed":true}'::jsonb
     ) RETURNING id`,
    [canarySecretRef],
  );

  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES ($1, 'weather.hourlyForecast', true), ($2, 'weather.hourlyForecast', true)`,
    [preferred.rows[0]!.id, fallback.rows[0]!.id],
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Phase 5A location and provider foundation end-to-end gate', () => {
  it('resolves current two-tier geography and keeps legacy aliases linked to successors', async () => {
    const resolved = await fastify.inject({
      method: 'GET',
      url: `/v1/locations/resolve?lat=${latitude}&lon=${longitude}&effectiveAt=2026-09-17`,
    });
    expect(resolved.statusCode).toBe(200);
    expect(resolved.json()).toMatchObject({
      spatialRepresentation: 'POINT',
      timeZone: 'Asia/Ho_Chi_Minh',
      administrativeAreas: [
        { publicId: 'area:phase5a:province', kind: 'PROVINCE' },
        { publicId: 'area:phase5a:commune', kind: 'COMMUNE' },
      ],
    });

    const historical = await fastify.inject({
      method: 'GET',
      url: '/v1/locations/search?q=Nghia%20Hung%20Cu&scope=administrative&effectiveAt=2026-09-17',
    });
    expect(historical.statusCode).toBe(200);
    expect(historical.json().items[0]).toMatchObject({
      matchKind: 'HISTORICAL',
      area: { publicId: 'area:phase5a:legacy-district', kind: 'HISTORICAL_DISTRICT' },
      successors: [
        { publicId: 'area:phase5a:commune', relationship: 'REORGANIZED_TO' },
      ],
    });
  });

  it('selects the healthy commercial fallback when the higher-priority source is licence-blocked', async () => {
    const candidates = await loadCandidates();
    const fallback = candidates.find((candidate) => candidate.providerKey === 'fixture-fallback-allowed');
    const restricted = candidates.find((candidate) => candidate.providerKey === 'fixture-preferred-restricted');
    expect(fallback?.coversLocation).toBe(true);
    expect(restricted?.coversLocation).toBe(true);

    const result = await selectCommercialWeather();
    expect(result.candidates.map((candidate) => candidate.providerId)).toEqual([
      restricted!.providerId,
      fallback!.providerId,
    ]);
    expect(result.candidates[0]).toMatchObject({
      providerId: restricted!.providerId,
      accepted: false,
      rejectionCodes: ['LICENCE_BLOCKED'],
    });
    expect(result.selectedProviderId).toBe(fallback!.providerId);
  });

  it('changes deterministic ordering through audited admin priority update without exposing the secret canary', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/v1/admin/providers/fixture-fallback-allowed',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'phase5a-priority-change',
      },
      payload: providerPayload(300),
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.json())).not.toContain(canarySecretRef);
    expect(response.json()).toMatchObject({
      providerKey: 'fixture-fallback-allowed',
      priority: 300,
      hasSecretRef: true,
    });

    const candidates = await loadCandidates();
    const fallback = candidates.find((candidate) => candidate.providerKey === 'fixture-fallback-allowed');
    const restricted = candidates.find((candidate) => candidate.providerKey === 'fixture-preferred-restricted');
    const result = await selectCommercialWeather();
    expect(result.candidates.map((candidate) => candidate.providerId)).toEqual([
      fallback!.providerId,
      restricted!.providerId,
    ]);
    expect(result.selectedProviderId).toBe(fallback!.providerId);

    const audit = await pool.query<{
      correlation_id: string;
      before_state: unknown;
      after_state: unknown;
    }>(
      `SELECT correlation_id, before_state, after_state
       FROM audit_log
       WHERE target_type = 'provider_config' AND target_id = 'fixture-fallback-allowed'
       ORDER BY id DESC LIMIT 1`,
    );
    expect(audit.rows[0]?.correlation_id).toBe('phase5a-priority-change');
    expect(JSON.stringify(audit.rows[0])).not.toContain(canarySecretRef);
  });
});
