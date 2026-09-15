import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PermanentJobError } from '@connuoc/job-queue';

import { FixtureWaterLevelAdapter } from '../src/fixture-adapter.js';
import { ingestSourcePayload } from '../src/ingest.js';
import { PgIngestionRepository } from '../src/repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for ingestion integration tests');

const validUrl = new URL('../../../data/fixtures/ingestion/water-level-valid.json', import.meta.url);
const invalidUrl = new URL('../../../data/fixtures/ingestion/water-level-invalid.json', import.meta.url);

const pool = new Pool({ connectionString: databaseUrl });
const repository = new PgIngestionRepository(pool);

describe('fixture ingestion against PostGIS', () => {
  beforeAll(async () => {
    await pool.query('SELECT 1');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('imports once, replays idempotently, and preserves full provenance', async () => {
    const adapter = new FixtureWaterLevelAdapter(validUrl);
    const raw = await adapter.read();

    const first = await ingestSourcePayload(repository, adapter, raw);
    const replay = await ingestSourcePayload(repository, adapter, raw);

    expect(first.status).toBe('imported');
    expect(first.insertedObservations).toBe(2);
    expect(replay.status).toBe('duplicate');
    expect(replay.insertedObservations).toBe(0);

    const counts = await pool.query<{
      raw_count: string;
      run_count: string;
      station_count: string;
      observation_count: string;
    }>(`
      SELECT
        (SELECT count(*) FROM raw_payloads rp JOIN data_sources ds ON ds.id = rp.source_id WHERE ds.source_key = 'fixture-water-level') AS raw_count,
        (SELECT count(*) FROM source_import_runs ir JOIN data_sources ds ON ds.id = ir.source_id WHERE ds.source_key = 'fixture-water-level' AND ir.status = 'SUCCEEDED') AS run_count,
        (SELECT count(*) FROM stations WHERE public_id = 'fixture-ninh-binh-001') AS station_count,
        (SELECT count(*) FROM observations o JOIN data_sources ds ON ds.id = o.source_id WHERE ds.source_key = 'fixture-water-level') AS observation_count
    `);

    expect(counts.rows[0]).toEqual({
      raw_count: '1',
      run_count: '1',
      station_count: '1',
      observation_count: '2',
    });

    const provenance = await pool.query<{ count: string }>(`
      SELECT count(*)::text AS count
      FROM observations o
      JOIN data_sources ds ON ds.id = o.source_id
      JOIN source_import_runs ir ON ir.id = o.import_run_id
      JOIN raw_payloads rp ON rp.id = o.raw_payload_id
      WHERE ds.source_key = 'fixture-water-level'
        AND ir.source_id = o.source_id
        AND ir.raw_payload_id = o.raw_payload_id
        AND rp.source_id = o.source_id
        AND rp.checksum_sha256 ~ '^[0-9a-f]{64}$'
        AND ir.parser_version = 'fixture-parser-v1'
        AND ir.normalizer_version = 'water-level-normalizer-v1'
    `);
    expect(provenance.rows[0]?.count).toBe('2');
  });

  it('archives invalid raw data and failure diagnostics without partial normalized state', async () => {
    const adapter = new FixtureWaterLevelAdapter(invalidUrl);
    const raw = await adapter.read();

    await expect(ingestSourcePayload(repository, adapter, raw)).rejects.toBeInstanceOf(PermanentJobError);

    const partial = await pool.query<{ stations: string; observations: string }>(`
      SELECT
        (SELECT count(*) FROM stations WHERE public_id = 'fixture-invalid-station') AS stations,
        (SELECT count(*) FROM observations WHERE source_record_key = 'fixture-invalid-observation-001') AS observations
    `);
    expect(partial.rows[0]).toEqual({ stations: '0', observations: '0' });

    const failure = await pool.query<{
      raw_count: string;
      rejected_count: string;
      permanent: string | null;
    }>(`
      SELECT
        (SELECT count(*) FROM raw_payloads rp JOIN data_sources ds ON ds.id = rp.source_id WHERE ds.source_key = 'fixture-water-level') AS raw_count,
        (SELECT count(*) FROM source_import_runs ir JOIN data_sources ds ON ds.id = ir.source_id WHERE ds.source_key = 'fixture-water-level' AND ir.status = 'REJECTED') AS rejected_count,
        (
          SELECT ir.metadata -> 'deadLetter' ->> 'permanent'
          FROM source_import_runs ir
          JOIN data_sources ds ON ds.id = ir.source_id
          WHERE ds.source_key = 'fixture-water-level' AND ir.status = 'REJECTED'
          ORDER BY ir.finished_at DESC
          LIMIT 1
        ) AS permanent
    `);

    expect(failure.rows[0]).toEqual({ raw_count: '2', rejected_count: '1', permanent: 'true' });
  });
});
