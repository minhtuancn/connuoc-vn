import type { Pool, PoolClient } from 'pg';

import type { NormalizedImportBatch, RawSourcePayload } from './contracts.js';

export interface SourceSnapshot {
  readonly id: string;
  readonly sourceKey: string;
}

export interface ArchivedPayload {
  readonly id: string;
  readonly sourceId: string;
  readonly checksumSha256: string;
  readonly duplicate: boolean;
}

export interface ImportRunSnapshot {
  readonly id: string;
  readonly status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'REJECTED';
}

export interface ArchiveRawPayloadInput {
  readonly sourceId: string;
  readonly raw: RawSourcePayload;
  readonly checksumSha256: string;
}

export interface NormalizedCommitInput {
  readonly sourceId: string;
  readonly rawPayloadId: string;
  readonly idempotencyKey: string;
  readonly parserVersion: string;
  readonly normalizerVersion: string;
  readonly batch: NormalizedImportBatch;
}

export interface RecordFailedImportInput {
  readonly sourceId: string;
  readonly rawPayloadId: string;
  readonly idempotencyKey: string;
  readonly parserVersion: string;
  readonly normalizerVersion: string;
  readonly status: 'FAILED' | 'REJECTED';
  readonly errorSummary: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface NormalizedCommitResult {
  readonly importRunId: string;
  readonly insertedObservations: number;
  readonly duplicate?: boolean;
}

export interface IngestionRepository {
  ensureSource(input: {
    sourceKey: string;
    name: string;
    sourceType: string;
    metadata?: Readonly<Record<string, unknown>>;
  }): Promise<SourceSnapshot>;
  archiveRawPayload(input: ArchiveRawPayloadInput): Promise<ArchivedPayload>;
  findImportRun(idempotencyKey: string): Promise<ImportRunSnapshot | null>;
  commitNormalizedImport(input: NormalizedCommitInput): Promise<NormalizedCommitResult>;
  recordFailedImport(input: RecordFailedImportInput): Promise<{ readonly importRunId: string }>;
}

interface IdRow {
  readonly id: string;
}

interface ImportRunRow extends IdRow {
  readonly status: ImportRunSnapshot['status'];
}

export class PgIngestionRepository implements IngestionRepository {
  constructor(private readonly pool: Pool) {}

  async ensureSource(input: {
    sourceKey: string;
    name: string;
    sourceType: string;
    metadata?: Readonly<Record<string, unknown>>;
  }): Promise<SourceSnapshot> {
    const result = await this.pool.query<IdRow>(
      `INSERT INTO data_sources (source_key, name, source_type, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (source_key) DO UPDATE SET
         name = EXCLUDED.name,
         source_type = EXCLUDED.source_type,
         metadata = data_sources.metadata || EXCLUDED.metadata,
         updated_at = now()
       RETURNING id`,
      [input.sourceKey, input.name, input.sourceType, JSON.stringify(input.metadata ?? {})],
    );

    const row = result.rows[0];
    if (!row) throw new Error('Failed to resolve data source');
    return { id: row.id, sourceKey: input.sourceKey };
  }

  async archiveRawPayload(input: ArchiveRawPayloadInput): Promise<ArchivedPayload> {
    const inserted = await this.pool.query<IdRow>(
      `INSERT INTO raw_payloads (
         source_id, payload_key, checksum_sha256, media_type, byte_length,
         storage_uri, captured_at, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (source_id, checksum_sha256) DO NOTHING
       RETURNING id`,
      [
        input.sourceId,
        input.raw.payloadKey,
        input.checksumSha256,
        input.raw.mediaType,
        input.raw.bytes.byteLength,
        input.raw.storageUri,
        input.raw.capturedAt,
        JSON.stringify({ rawSourceKey: input.raw.sourceKey }),
      ],
    );

    if (inserted.rows[0]) {
      return {
        id: inserted.rows[0].id,
        sourceId: input.sourceId,
        checksumSha256: input.checksumSha256,
        duplicate: false,
      };
    }

    const existing = await this.pool.query<IdRow>(
      `SELECT id FROM raw_payloads WHERE source_id = $1 AND checksum_sha256 = $2`,
      [input.sourceId, input.checksumSha256],
    );
    const row = existing.rows[0];
    if (!row) throw new Error('Raw payload conflict did not resolve to an existing row');

    return {
      id: row.id,
      sourceId: input.sourceId,
      checksumSha256: input.checksumSha256,
      duplicate: true,
    };
  }

  async findImportRun(idempotencyKey: string): Promise<ImportRunSnapshot | null> {
    const result = await this.pool.query<ImportRunRow>(
      `SELECT id, status FROM source_import_runs WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async commitNormalizedImport(input: NormalizedCommitInput): Promise<NormalizedCommitResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.idempotencyKey]);

      const existing = await client.query<ImportRunRow>(
        `SELECT id, status FROM source_import_runs WHERE idempotency_key = $1 FOR UPDATE`,
        [input.idempotencyKey],
      );
      const existingRun = existing.rows[0];
      if (existingRun?.status === 'SUCCEEDED') {
        await client.query('COMMIT');
        return { importRunId: existingRun.id, insertedObservations: 0, duplicate: true };
      }

      const run = await client.query<IdRow>(
        `INSERT INTO source_import_runs (
           source_id, raw_payload_id, idempotency_key, parser_version,
           normalizer_version, status, started_at, finished_at,
           accepted_records, rejected_records, error_summary, metadata
         )
         VALUES ($1, $2, $3, $4, $5, 'RUNNING', now(), NULL, 0, 0, NULL, '{}'::jsonb)
         ON CONFLICT (idempotency_key) DO UPDATE SET
           source_id = EXCLUDED.source_id,
           raw_payload_id = EXCLUDED.raw_payload_id,
           parser_version = EXCLUDED.parser_version,
           normalizer_version = EXCLUDED.normalizer_version,
           status = 'RUNNING',
           started_at = now(),
           finished_at = NULL,
           accepted_records = 0,
           rejected_records = 0,
           error_summary = NULL,
           metadata = '{}'::jsonb
         RETURNING id`,
        [
          input.sourceId,
          input.rawPayloadId,
          input.idempotencyKey,
          input.parserVersion,
          input.normalizerVersion,
        ],
      );
      const runRow = run.rows[0];
      if (!runRow) throw new Error('Failed to create import run');

      const stationId = await this.upsertStation(client, input);
      let insertedObservations = 0;

      for (const observation of input.batch.observations) {
        const inserted = await client.query(
          `INSERT INTO observations (
             station_id, source_id, import_run_id, raw_payload_id,
             source_record_key, observed_at, value, unit, datum_id,
             quality_state, metadata
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
           ON CONFLICT (source_id, source_record_key) DO NOTHING
           RETURNING id`,
          [
            stationId,
            input.sourceId,
            runRow.id,
            input.rawPayloadId,
            observation.sourceRecordKey,
            observation.observedAt,
            observation.value,
            observation.unit,
            observation.datumId ?? null,
            observation.qualityState,
            JSON.stringify(observation.metadata ?? {}),
          ],
        );
        if (inserted.rowCount === 1) insertedObservations += 1;
      }

      const rejectedRecords = input.batch.observations.length - insertedObservations;
      await client.query(
        `UPDATE source_import_runs SET
           status = 'SUCCEEDED',
           finished_at = now(),
           accepted_records = $2,
           rejected_records = $3,
           metadata = jsonb_build_object('stationPublicId', $4::text)
         WHERE id = $1`,
        [runRow.id, insertedObservations, rejectedRecords, input.batch.station.publicId],
      );

      await client.query('COMMIT');
      return { importRunId: runRow.id, insertedObservations };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordFailedImport(input: RecordFailedImportInput): Promise<{ readonly importRunId: string }> {
    const result = await this.pool.query<IdRow>(
      `INSERT INTO source_import_runs (
         source_id, raw_payload_id, idempotency_key, parser_version,
         normalizer_version, status, started_at, finished_at,
         accepted_records, rejected_records, error_summary, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, now(), now(), 0, 0, $7, $8::jsonb)
       ON CONFLICT (idempotency_key) DO UPDATE SET
         source_id = EXCLUDED.source_id,
         raw_payload_id = EXCLUDED.raw_payload_id,
         parser_version = EXCLUDED.parser_version,
         normalizer_version = EXCLUDED.normalizer_version,
         status = EXCLUDED.status,
         finished_at = now(),
         accepted_records = 0,
         rejected_records = 0,
         error_summary = EXCLUDED.error_summary,
         metadata = EXCLUDED.metadata
       RETURNING id`,
      [
        input.sourceId,
        input.rawPayloadId,
        input.idempotencyKey,
        input.parserVersion,
        input.normalizerVersion,
        input.status,
        input.errorSummary,
        JSON.stringify(input.metadata),
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to record failed import');
    return { importRunId: row.id };
  }

  private async upsertStation(client: PoolClient, input: NormalizedCommitInput): Promise<string> {
    const station = input.batch.station;
    const result = await client.query<IdRow>(
      `INSERT INTO stations (
         public_id, name, station_type, time_zone, location, default_datum_id, metadata
       )
       VALUES (
         $1, $2, $3, $4,
         ST_SetSRID(ST_MakePoint($5, $6), 4326),
         $7,
         jsonb_build_object('lastSourceId', $8::text)
       )
       ON CONFLICT (public_id) DO UPDATE SET
         name = EXCLUDED.name,
         station_type = EXCLUDED.station_type,
         time_zone = EXCLUDED.time_zone,
         location = EXCLUDED.location,
         default_datum_id = EXCLUDED.default_datum_id,
         metadata = stations.metadata || EXCLUDED.metadata,
         updated_at = now()
       RETURNING id`,
      [
        station.publicId,
        station.name,
        station.stationType,
        station.timeZone,
        station.longitude,
        station.latitude,
        station.defaultDatumId ?? null,
        input.sourceId,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to resolve station');
    return row.id;
  }
}
