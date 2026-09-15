import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
  QUEUE_NAMES,
  bullMqConnectionFromUrl,
  createJobQueue,
  deterministicJobId,
  type SourceIngestionJob,
} from '@connuoc/job-queue';
import {
  FixtureWaterLevelAdapter,
  PgIngestionRepository,
  handleSourceIngestionJob,
  type IngestionResult,
} from '@connuoc/tide-worker';
import { QueueEvents, Worker } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { hashAdminBearerToken } from '../src/modules/admin/admin-auth.js';
import { buildOpenApiDocument } from '../src/openapi.js';

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for the Phase 2 exit gate');
if (!redisUrl) throw new Error('REDIS_URL is required for the Phase 2 exit gate');

const fixtureUrl = new URL('../../../data/fixtures/ingestion/water-level-valid.json', import.meta.url);
const adapter = new FixtureWaterLevelAdapter(fixtureUrl);
const connection = bullMqConnectionFromUrl(redisUrl);
const pool = new Pool({ connectionString: databaseUrl, application_name: 'phase2-exit-gate' });
const ingestionRepository = new PgIngestionRepository(pool);
const adapters = new Map([[adapter.sourceKey, adapter]]);
const queue = createJobQueue<SourceIngestionJob>(QUEUE_NAMES.sourceIngestion, connection);
const queueEvents = new QueueEvents(QUEUE_NAMES.sourceIngestion, { connection });

const environment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});
const viewerToken = 'phase2-exit-viewer-token-0123456789-abcdef-XYZ';
const operatorToken = 'phase2-exit-operator-token-0123456789-abcdef-XYZ';

let worker: Worker<SourceIngestionJob, IngestionResult>;
let app: Awaited<ReturnType<typeof createApiApp>>;
let fastify: FastifyInstance;
let firstResult: IngestionResult | undefined;
let replayResult: IngestionResult | undefined;
let importRunId = '';
let rawChecksumSha256 = '';

async function resetDatabase(): Promise<void> {
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
}

function ingestionJob(idempotencyKey: string): SourceIngestionJob {
  return {
    schemaVersion: 1,
    sourceKey: adapter.sourceKey,
    adapterVersion: adapter.adapterVersion,
    idempotencyKey,
    requestedAtUtc: '2026-09-15T00:00:00.000Z',
    trigger: 'manual',
  };
}

async function enqueueAndWait(idempotencyKey: string): Promise<IngestionResult> {
  const data = ingestionJob(idempotencyKey);
  const job = await queue.add('phase2-exit-ingestion', data, {
    jobId: deterministicJobId(QUEUE_NAMES.sourceIngestion, idempotencyKey),
  });
  return await job.waitUntilFinished(queueEvents, 30_000);
}

async function seedTideModelFromIngestion(): Promise<void> {
  const provenance = await pool.query<{
    station_id: string;
    source_id: string;
    import_run_id: string;
    raw_checksum_sha256: string;
  }>(
    `SELECT o.station_id::text, o.source_id::text, o.import_run_id::text,
            rp.checksum_sha256 AS raw_checksum_sha256
     FROM observations o
     JOIN stations s ON s.id = o.station_id
     JOIN raw_payloads rp ON rp.id = o.raw_payload_id
     WHERE s.public_id = 'fixture-ninh-binh-001'
     ORDER BY o.observed_at DESC
     LIMIT 1`,
  );
  const row = provenance.rows[0];
  if (!row) throw new Error('Queue ingestion did not create the expected station observation provenance');

  importRunId = row.import_run_id;
  rawChecksumSha256 = row.raw_checksum_sha256;
  const tideModel = await pool.query<{ id: string }>(
    `INSERT INTO tide_models (
       station_id, source_id, import_run_id, model_id, model_version, datum_id, unit,
       mean_level, reference_epoch, phase_convention
     ) VALUES ($1, $2, $3, 'phase2-exit-harmonic', 'phase2-exit-v1',
       'local-gauge-fixture', 'm', 1.0, '2026-01-01T00:00:00Z', 'cosine_lag_degrees')
     RETURNING id`,
    [row.station_id, row.source_id, row.import_run_id],
  );
  await pool.query(
    `INSERT INTO tide_constituents (
       tide_model_id, name, amplitude, phase_degrees, speed_degrees_per_hour, ordinal
     ) VALUES ($1, 'M2', 0.5, 0, 28.9841042, 0)`,
    [tideModel.rows[0]!.id],
  );
}

async function seedAdminPrincipals(): Promise<void> {
  const viewer = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('phase2-viewer', 'Phase 2 Viewer', 'viewer') RETURNING id`,
  );
  const operator = await pool.query<{ id: string }>(
    `INSERT INTO admin_principals (actor_id, display_name, role)
     VALUES ('phase2-operator', 'Phase 2 Operator', 'data-operator') RETURNING id`,
  );
  await pool.query(
    `INSERT INTO admin_api_tokens (principal_id, token_hash_sha256, label)
     VALUES ($1, $2, 'phase2-viewer-runtime'), ($3, $4, 'phase2-operator-runtime')`,
    [
      viewer.rows[0]!.id,
      hashAdminBearerToken(viewerToken),
      operator.rows[0]!.id,
      hashAdminBearerToken(operatorToken),
    ],
  );
}

function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await resetDatabase();
  await queue.waitUntilReady();
  await queue.obliterate({ force: true });
  await queueEvents.waitUntilReady();
  worker = new Worker<SourceIngestionJob, IngestionResult>(
    QUEUE_NAMES.sourceIngestion,
    async (job) => await handleSourceIngestionJob(ingestionRepository, adapters, job.data),
    { connection },
  );
  await worker.waitUntilReady();
});

afterAll(async () => {
  await app?.close();
  await worker?.close();
  await queueEvents.close();
  await queue.obliterate({ force: true });
  await queue.close();
  await pool.end();
});

describe('Phase 2 backend/data platform exit gate', () => {
  it('processes the fixture through Redis/BullMQ and replays the same raw payload idempotently', async () => {
    firstResult = await enqueueAndWait('phase2-exit-first');
    replayResult = await enqueueAndWait('phase2-exit-replay');

    expect(firstResult).toMatchObject({ status: 'imported', insertedObservations: 2 });
    expect(replayResult).toMatchObject({ status: 'duplicate', insertedObservations: 0 });

    const counts = await pool.query<{
      raw_count: string;
      run_count: string;
      observation_count: string;
    }>(`
      SELECT
        (SELECT count(*) FROM raw_payloads rp JOIN data_sources ds ON ds.id = rp.source_id
          WHERE ds.source_key = 'fixture-water-level')::text AS raw_count,
        (SELECT count(*) FROM source_import_runs ir JOIN data_sources ds ON ds.id = ir.source_id
          WHERE ds.source_key = 'fixture-water-level' AND ir.status = 'SUCCEEDED')::text AS run_count,
        (SELECT count(*) FROM observations o JOIN data_sources ds ON ds.id = o.source_id
          WHERE ds.source_key = 'fixture-water-level')::text AS observation_count
    `);
    expect(counts.rows[0]).toEqual({ raw_count: '1', run_count: '1', observation_count: '2' });
  });

  it('serves the queue-ingested station and tide model with complete provenance and OpenAPI coverage', async () => {
    await seedTideModelFromIngestion();
    await seedAdminPrincipals();
    app = await createApiApp(environment);
    await app.init();
    fastify = app.getHttpAdapter().getInstance() as FastifyInstance;

    const station = await fastify.inject({
      method: 'GET',
      url: '/v1/stations/fixture-ninh-binh-001',
    });
    expect(station.statusCode).toBe(200);
    expect(station.json()).toMatchObject({
      id: 'fixture-ninh-binh-001',
      defaultDatumId: 'local-gauge-fixture',
      provenance: {
        sourceKey: 'fixture-water-level',
        rawChecksumSha256,
        parserVersion: 'fixture-parser-v1',
        normalizerVersion: 'water-level-normalizer-v1',
      },
    });

    const tide = await fastify.inject({
      method: 'GET',
      url: '/v1/stations/fixture-ninh-binh-001/tide?start=2026-01-01T00%3A00%3A00.000Z&end=2026-01-01T02%3A00%3A00.000Z&intervalSeconds=3600',
    });
    expect(tide.statusCode).toBe(200);
    expect(tide.json()).toMatchObject({
      meta: {
        modelId: 'phase2-exit-harmonic',
        modelVersion: 'phase2-exit-v1',
        datumId: 'local-gauge-fixture',
        provenance: {
          sourceKey: 'fixture-water-level',
          importRunId,
        },
      },
    });

    const document = buildOpenApiDocument(app);
    const paths = Object.keys(document.paths);
    expect(paths.some((path) => path.endsWith('/stations/{id}'))).toBe(true);
    expect(paths.some((path) => path.endsWith('/stations/{id}/tide'))).toBe(true);
    expect(paths.some((path) => path.endsWith('/admin/sources/{sourceKey}'))).toBe(true);
  });

  it('enforces admin authentication/RBAC and appends a traceable audit mutation', async () => {
    const anonymous = await fastify.inject({ method: 'GET', url: '/v1/admin/sources' });
    expect(anonymous.statusCode).toBe(401);

    const denied = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/sources/fixture-water-level',
      headers: { ...bearer(viewerToken), 'content-type': 'application/json' },
      payload: { metadata: { exitGateViewerAttempt: true } },
    });
    expect(denied.statusCode).toBe(403);

    const allowed = await fastify.inject({
      method: 'PATCH',
      url: '/v1/admin/sources/fixture-water-level',
      headers: {
        ...bearer(operatorToken),
        'content-type': 'application/json',
        'x-request-id': 'phase2-exit-audit-1',
      },
      payload: { metadata: { phase2ExitVerified: true } },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.headers['x-request-id']).toBe('phase2-exit-audit-1');

    const audit = await pool.query<{
      actor_id: string;
      action: string;
      correlation_id: string;
      before_state: Record<string, unknown>;
      after_state: Record<string, unknown>;
    }>(
      `SELECT actor_id, action, correlation_id, before_state, after_state
       FROM audit_log WHERE correlation_id = 'phase2-exit-audit-1'`,
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      actor_id: 'phase2-operator',
      action: 'admin.source.update',
      correlation_id: 'phase2-exit-audit-1',
    });
    expect(audit.rows[0]!.before_state).not.toEqual(audit.rows[0]!.after_state);

    const hashes = await pool.query<{ token_hash_sha256: string }>(
      'SELECT token_hash_sha256 FROM admin_api_tokens ORDER BY label',
    );
    expect(hashes.rows).toHaveLength(2);
    for (const row of hashes.rows) {
      expect(row.token_hash_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(row.token_hash_sha256).not.toBe(viewerToken);
      expect(row.token_hash_sha256).not.toBe(operatorToken);
    }
  });

  it('writes machine-readable Phase 2 evidence for the CI artifact', async () => {
    const evidencePath = process.env.PHASE2_EVIDENCE_PATH ?? '/tmp/connuoc-phase2-exit-evidence.json';
    const counts = await pool.query<{
      observations: string;
      raw_payloads: string;
      successful_imports: string;
      audit_rows: string;
    }>(`
      SELECT
        (SELECT count(*) FROM observations)::text AS observations,
        (SELECT count(*) FROM raw_payloads)::text AS raw_payloads,
        (SELECT count(*) FROM source_import_runs WHERE status = 'SUCCEEDED')::text AS successful_imports,
        (SELECT count(*) FROM audit_log)::text AS audit_rows
    `);
    const evidence = {
      schemaVersion: 1,
      generatedAtUtc: new Date().toISOString(),
      fixture: 'data/fixtures/ingestion/water-level-valid.json',
      queue: {
        name: QUEUE_NAMES.sourceIngestion,
        firstResult,
        replayResult,
      },
      database: counts.rows[0],
      provenance: {
        sourceKey: 'fixture-water-level',
        importRunId,
        rawChecksumSha256,
        parserVersion: 'fixture-parser-v1',
        normalizerVersion: 'water-level-normalizer-v1',
        tideModelId: 'phase2-exit-harmonic',
        tideModelVersion: 'phase2-exit-v1',
      },
      api: {
        stationEndpoint: '/v1/stations/fixture-ninh-binh-001',
        tideEndpoint: '/v1/stations/fixture-ninh-binh-001/tide',
        openApiVerified: true,
      },
      admin: {
        anonymousDenied: true,
        viewerMutationDenied: true,
        operatorMutationAudited: true,
        correlationId: 'phase2-exit-audit-1',
      },
      limitations: [
        'The source payload is a repository-owned synthetic fixture, not a live external provider payload.',
        'BullMQ uses real Redis, but the Worker runs in the same test process rather than a separately deployed worker process.',
        'The harmonic tide model is deterministic synthetic test data attached to the ingestion provenance because the fixture source contains observed water levels, not harmonic constituents.',
      ],
    };
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    expect(evidence.database).toMatchObject({
      observations: '2',
      raw_payloads: '1',
      successful_imports: '1',
      audit_rows: '1',
    });
  });
});
