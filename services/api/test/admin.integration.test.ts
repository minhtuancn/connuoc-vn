import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { hashAdminBearerToken } from '../src/modules/admin/admin-auth.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for admin integration tests');

const viewerToken = 'fixture-viewer-token-0123456789-abcdef-XYZ';
const operatorToken = 'fixture-operator-token-0123456789-abcdef-XYZ';
const pool = new Pool({ connectionString: databaseUrl, application_name: 'admin-integration-seed' });
const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let importRunId: string;

async function seed(): Promise<void> {
  await pool.query(`TRUNCATE TABLE
    admin_api_tokens,
    admin_principals,
    audit_log,
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

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('admin-fixture', 'Admin Fixture Source', 'fixture') RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;
  const raw = await pool.query<{ id: string }>(
    `INSERT INTO raw_payloads (source_id, payload_key, checksum_sha256, captured_at)
     VALUES ($1, 'admin-fixture-payload', $2, '2026-09-15T00:00:00Z') RETURNING id`,
    [sourceId, 'd'.repeat(64)],
  );
  const importRun = await pool.query<{ id: string }>(
    `INSERT INTO source_import_runs (
       source_id, raw_payload_id, idempotency_key, parser_version, normalizer_version,
       status, started_at, finished_at, accepted_records, rejected_records
     ) VALUES ($1, $2, 'admin-fixture-import', 'fixture-parser@1', 'fixture-normalizer@1',
       'SUCCEEDED', '2026-09-15T00:00:00Z', '2026-09-15T00:00:01Z', 0, 0)
     RETURNING id`,
    [sourceId, raw.rows[0]!.id],
  );
  importRunId = importRun.rows[0]!.id;

  await pool.query(
    `INSERT INTO stations (public_id, name, station_type, time_zone, location, default_datum_id)
     VALUES ('admin-station', 'Admin Fixture Station', 'water_level', 'Asia/Ho_Chi_Minh',
       ST_SetSRID(ST_MakePoint(106.08, 20.25), 4326), 'admin-datum')`,
  );

  const viewer = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('viewer-1', 'Viewer One', 'viewer') RETURNING id`,
  );
  const operator = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('operator-1', 'Operator One', 'data-operator') RETURNING id`,
  );
  await pool.query(
    `INSERT INTO admin_api_tokens (principal_id, token_hash_sha256, label)
     VALUES ($1, $2, 'viewer-runtime'), ($3, $4, 'operator-runtime')`,
    [
      viewer.rows[0]!.id,
      hashAdminBearerToken(viewerToken),
      operator.rows[0]!.id,
      hashAdminBearerToken(operatorToken),
    ],
  );
}

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await seed();
  app = await createApiApp(environment);
  await app.init();
  fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Phase 2 admin security and audit boundary', () => {
  it('denies anonymous admin access while keeping public routes anonymous', async () => {
    const anonymousAdmin = await fastify.inject({ method: 'GET', url: '/v1/admin/sources' });
    expect(anonymousAdmin.statusCode).toBe(401);
    expect(anonymousAdmin.headers['content-type']).toContain('application/problem+json');

    const publicCalendar = await fastify.inject({ method: 'GET', url: '/v1/calendar?date=2024-02-10' });
    expect(publicCalendar.statusCode).toBe(200);
  });

  it('allows viewer reads but denies viewer mutations', async () => {
    const read = await fastify.inject({
      method: 'GET',
      url: '/v1/admin/sources',
      headers: bearer(viewerToken),
    });
    expect(read.statusCode).toBe(200);
    expect(read.json()).toMatchObject({ items: [{ sourceKey: 'admin-fixture' }] });

    const mutation = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/sources/admin-fixture',
      headers: { ...bearer(viewerToken), 'content-type': 'application/json' },
      payload: { isActive: false },
    });
    expect(mutation.statusCode).toBe(403);
    expect(mutation.headers['content-type']).toContain('application/problem+json');
  });

  it('allows operator source/station/import mutations and emits traceable audit records', async () => {
    const source = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/sources/admin-fixture',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'corr-source-1',
      },
      payload: { isActive: false, metadata: { reviewed: true } },
    });
    expect(source.statusCode).toBe(200);
    expect(source.headers['x-request-id']).toBe('corr-source-1');
    expect(source.json()).toMatchObject({ sourceKey: 'admin-fixture', isActive: false });

    const station = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/stations/admin-station',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'corr-station-1',
      },
      payload: { name: 'Admin Station Updated', latitude: 20.26, longitude: 106.09 },
    });
    expect(station.statusCode).toBe(200);
    expect(station.json()).toMatchObject({ id: 'admin-station', name: 'Admin Station Updated' });

    const imported = await fastify.inject({
      method: 'PATCH',
      url: `/v1/admin/imports/${importRunId}`,
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'corr-import-1',
      },
      payload: { metadata: { operatorNote: 'verified' } },
    });
    expect(imported.statusCode).toBe(200);
    expect(imported.json()).toMatchObject({ id: importRunId, metadata: { operatorNote: 'verified' } });

    const audits = await pool.query<{
      actor_id: string;
      action: string;
      target_type: string;
      target_id: string;
      correlation_id: string;
      before_state: Record<string, unknown>;
      after_state: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }>(
      `SELECT actor_id, action, target_type, target_id, correlation_id,
              before_state, after_state, metadata
       FROM audit_log ORDER BY id`,
    );
    expect(audits.rows).toHaveLength(3);
    expect(audits.rows.map((row) => row.action)).toEqual([
      'admin.source.update',
      'admin.station.update',
      'admin.import.annotate',
    ]);
    expect(audits.rows.map((row) => row.correlation_id)).toEqual([
      'corr-source-1',
      'corr-station-1',
      'corr-import-1',
    ]);
    for (const row of audits.rows) {
      expect(row.actor_id).toBe('operator-1');
      expect(JSON.stringify(row)).not.toContain(operatorToken);
      expect(row.before_state).not.toEqual(row.after_state);
      expect(row.metadata).toMatchObject({ role: 'data-operator' });
    }
  });

  it('keeps audit history append-only', async () => {
    const first = await pool.query<{ id: number }>('SELECT id FROM audit_log ORDER BY id LIMIT 1');
    await expect(pool.query('UPDATE audit_log SET action = $2 WHERE id = $1', [first.rows[0]!.id, 'tampered']))
      .rejects.toMatchObject({ message: expect.stringContaining('audit_log is append-only') });
  });
});
