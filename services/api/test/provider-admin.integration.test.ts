import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { hashAdminBearerToken } from '../src/modules/admin/admin-auth.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for provider admin integration tests');

const viewerToken = 'provider-viewer-token-0123456789-abcdef-XYZ';
const operatorToken = 'provider-operator-token-0123456789-abcdef-XYZ';
const canarySecretRef = 'vault://CANARY-PROVIDER-SECRET-DO-NOT-EXPOSE';
const pool = new Pool({ connectionString: databaseUrl, application_name: 'provider-admin-integration' });
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

function providerPayload(overrides: Record<string, unknown> = {}) {
  return {
    providerType: 'fixture-weather',
    enabled: false,
    priority: 100,
    weight: 1,
    secretRef: canarySecretRef,
    endpointConfig: { baseUrl: 'https://weather.example.test', timeoutMs: 10_000 },
    commercialUseStatus: 'ALLOWED',
    redistributionStatus: 'ATTRIBUTION_REQUIRED',
    licenceStatus: 'REVIEWED',
    attributionText: 'Fixture attribution',
    attributionUrl: 'https://weather.example.test/terms',
    coverageGeoJson: null,
    quotaPolicy: { requestsPerDay: 10_000, blockWhenExhausted: true },
    budgetPolicy: { monthlyUsd: 100, blockWhenExceeded: true },
    freshnessPolicy: { maxAgeSeconds: 3600 },
    modelAllowList: ['fixture-model'],
    fallbackGroup: 'weather-default',
    healthState: 'HEALTHY',
    healthBlocksSelection: true,
    capabilities: ['weather.hourlyForecast'],
    metadata: { reviewed: true },
    ...overrides,
  };
}

beforeAll(async () => {
  await pool.query(`TRUNCATE TABLE
    admin_api_tokens,
    admin_principals,
    audit_log,
    provider_health_events,
    provider_capabilities,
    provider_configs
    RESTART IDENTITY CASCADE`);

  const viewer = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('provider-viewer-1', 'Provider Viewer', 'viewer') RETURNING id`,
  );
  const operator = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('provider-operator-1', 'Provider Operator', 'data-operator') RETURNING id`,
  );
  await pool.query(
    `INSERT INTO admin_api_tokens (principal_id, token_hash_sha256, label)
     VALUES ($1, $2, 'provider-viewer'), ($3, $4, 'provider-operator')`,
    [
      viewer.rows[0]!.id,
      hashAdminBearerToken(viewerToken),
      operator.rows[0]!.id,
      hashAdminBearerToken(operatorToken),
    ],
  );

  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Phase 5A provider admin boundary', () => {
  it('requires authentication for provider metadata', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/v1/admin/providers' });
    expect(response.statusCode).toBe(401);
  });

  it('allows viewer reads but denies provider mutations', async () => {
    const read = await fastify.inject({
      method: 'GET',
      url: '/v1/admin/providers',
      headers: bearer(viewerToken),
    });
    expect(read.statusCode).toBe(200);

    const write = await fastify.inject({
      method: 'PUT',
      url: '/v1/admin/providers/fixture-primary',
      headers: { ...bearer(viewerToken), 'content-type': 'application/json' },
      payload: providerPayload(),
    });
    expect(write.statusCode).toBe(403);
  });

  it('allows provider operator writes while keeping secret references out of reads and audit', async () => {
    const write = await fastify.inject({
      method: 'PUT',
      url: '/v1/admin/providers/fixture-primary',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'provider-put-1',
      },
      payload: providerPayload(),
    });
    expect(write.statusCode).toBe(200);
    expect(write.headers['x-request-id']).toBe('provider-put-1');
    expect(JSON.stringify(write.json())).not.toContain(canarySecretRef);
    expect(write.json()).toMatchObject({ providerKey: 'fixture-primary', hasSecretRef: true });

    const read = await fastify.inject({
      method: 'GET',
      url: '/v1/admin/providers/fixture-primary',
      headers: bearer(viewerToken),
    });
    expect(read.statusCode).toBe(200);
    expect(JSON.stringify(read.json())).not.toContain(canarySecretRef);
    expect(read.json()).toMatchObject({ providerKey: 'fixture-primary', hasSecretRef: true });

    const stored = await pool.query<{ secret_ref: string | null }>(
      `SELECT secret_ref FROM provider_configs WHERE provider_key = 'fixture-primary'`,
    );
    expect(stored.rows[0]?.secret_ref).toBe(canarySecretRef);

    const audit = await pool.query<{ before_state: unknown; after_state: unknown; action: string }>(
      `SELECT action, before_state, after_state
       FROM audit_log WHERE target_type = 'provider_config' ORDER BY id DESC LIMIT 1`,
    );
    expect(audit.rows[0]?.action).toBe('admin.provider.put');
    expect(JSON.stringify(audit.rows[0])).not.toContain(canarySecretRef);
  });

  it.each(['apiKey', 'token', 'password', 'secretValue'])(
    'rejects credential-looking write field %s',
    async (field) => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/v1/admin/providers/fixture-invalid',
        headers: { ...bearer(operatorToken), 'content-type': 'application/json' },
        payload: providerPayload({ [field]: 'CANARY-RAW-SECRET' }),
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it('rejects enabling a commercially restricted provider with a machine-readable policy code', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/v1/admin/providers/restricted-provider',
      headers: { ...bearer(operatorToken), 'content-type': 'application/json' },
      payload: providerPayload({ enabled: true, commercialUseStatus: 'RESTRICTED' }),
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.stringify(response.json())).toContain('LICENCE_BLOCKED');
  });

  it('supports operational status changes without exposing secret references', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/providers/fixture-primary/status',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'provider-status-1',
      },
      payload: { enabled: false, healthState: 'DEGRADED', healthBlocksSelection: true },
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.json())).not.toContain(canarySecretRef);
    expect(response.json()).toMatchObject({
      providerKey: 'fixture-primary',
      enabled: false,
      healthState: 'DEGRADED',
    });
  });
});
