import type { Pool, PoolClient } from 'pg';

import type { AdminActor } from './admin.types.js';

export type AdminDataErrorCode = 'NOT_FOUND' | 'DATABASE_UNAVAILABLE';

export class AdminDataError extends Error {
  override readonly name = 'AdminDataError';

  constructor(
    readonly code: AdminDataErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface AdminMutationContext {
  readonly actor: AdminActor;
  readonly correlationId: string;
  readonly requestMethod: string;
  readonly requestPath: string;
}

export interface SourcePatch {
  readonly name?: string | undefined;
  readonly isActive?: boolean | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface StationPatch {
  readonly name?: string | undefined;
  readonly timeZone?: string | undefined;
  readonly defaultDatumId?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
}

export interface ImportAnnotationPatch {
  readonly metadata: Readonly<Record<string, unknown>>;
}

interface JsonStateRow {
  readonly state: Record<string, unknown>;
}

export class PgAdminRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new AdminDataError('DATABASE_UNAVAILABLE', 'Admin database is not configured.');
    }
    return this.pool;
  }

  async listSources(): Promise<readonly Record<string, unknown>[]> {
    const result = await this.database().query(
      `SELECT source_key AS "sourceKey", name, source_type AS "sourceType",
              homepage_url AS "homepageUrl", license_code AS "licenseCode",
              is_active AS "isActive", metadata, created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM data_sources
       ORDER BY source_key`,
    );
    return result.rows;
  }

  async getStation(publicId: string): Promise<Record<string, unknown> | null> {
    const result = await this.database().query(
      `SELECT public_id AS id, name, station_type AS "stationType", time_zone AS "timeZone",
              ST_Y(location)::float8 AS latitude, ST_X(location)::float8 AS longitude,
              default_datum_id AS "defaultDatumId", metadata,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM stations WHERE public_id = $1`,
      [publicId],
    );
    return result.rows[0] ?? null;
  }

  async getImport(importRunId: string): Promise<Record<string, unknown> | null> {
    const result = await this.database().query(
      `SELECT sir.id::text AS id, ds.source_key AS "sourceKey",
              rp.checksum_sha256 AS "rawChecksumSha256", sir.idempotency_key AS "idempotencyKey",
              sir.parser_version AS "parserVersion", sir.normalizer_version AS "normalizerVersion",
              sir.status, sir.started_at AS "startedAt", sir.finished_at AS "finishedAt",
              sir.accepted_records AS "acceptedRecords", sir.rejected_records AS "rejectedRecords",
              sir.error_summary AS "errorSummary", sir.metadata
       FROM source_import_runs sir
       JOIN data_sources ds ON ds.id = sir.source_id
       JOIN raw_payloads rp ON rp.id = sir.raw_payload_id
       WHERE sir.id = $1::uuid`,
      [importRunId],
    );
    return result.rows[0] ?? null;
  }

  async updateSource(
    sourceKey: string,
    patch: SourcePatch,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    return this.withMutation(async (client) => {
      const before = await this.lockSourceState(client, sourceKey);
      if (!before) throw new AdminDataError('NOT_FOUND', `Source '${sourceKey}' was not found.`);

      await client.query(
        `UPDATE data_sources SET
           name = COALESCE($2, name),
           is_active = COALESCE($3::boolean, is_active),
           metadata = metadata || COALESCE($4::jsonb, '{}'::jsonb),
           updated_at = now()
         WHERE source_key = $1`,
        [
          sourceKey,
          patch.name ?? null,
          patch.isActive ?? null,
          patch.metadata ? JSON.stringify(patch.metadata) : null,
        ],
      );
      const after = await this.lockSourceState(client, sourceKey);
      if (!after) throw new AdminDataError('NOT_FOUND', `Source '${sourceKey}' disappeared during update.`);
      await this.appendAudit(client, context, 'admin.source.update', 'data_source', sourceKey, before, after);
      return after;
    });
  }

  async updateStation(
    publicId: string,
    patch: StationPatch,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    return this.withMutation(async (client) => {
      const before = await this.lockStationState(client, publicId);
      if (!before) throw new AdminDataError('NOT_FOUND', `Station '${publicId}' was not found.`);

      await client.query(
        `UPDATE stations SET
           name = COALESCE($2, name),
           time_zone = COALESCE($3, time_zone),
           default_datum_id = COALESCE($4, default_datum_id),
           metadata = metadata || COALESCE($5::jsonb, '{}'::jsonb),
           location = CASE
             WHEN $6::float8 IS NULL OR $7::float8 IS NULL THEN location
             ELSE ST_SetSRID(ST_MakePoint($7::float8, $6::float8), 4326)
           END,
           updated_at = now()
         WHERE public_id = $1`,
        [
          publicId,
          patch.name ?? null,
          patch.timeZone ?? null,
          patch.defaultDatumId ?? null,
          patch.metadata ? JSON.stringify(patch.metadata) : null,
          patch.latitude ?? null,
          patch.longitude ?? null,
        ],
      );
      const after = await this.lockStationState(client, publicId);
      if (!after) throw new AdminDataError('NOT_FOUND', `Station '${publicId}' disappeared during update.`);
      await this.appendAudit(client, context, 'admin.station.update', 'station', publicId, before, after);
      return after;
    });
  }

  async annotateImport(
    importRunId: string,
    patch: ImportAnnotationPatch,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    return this.withMutation(async (client) => {
      const before = await this.lockImportState(client, importRunId);
      if (!before) throw new AdminDataError('NOT_FOUND', `Import run '${importRunId}' was not found.`);

      await client.query(
        `UPDATE source_import_runs
         SET metadata = metadata || $2::jsonb
         WHERE id = $1::uuid`,
        [importRunId, JSON.stringify(patch.metadata)],
      );
      const after = await this.lockImportState(client, importRunId);
      if (!after) throw new AdminDataError('NOT_FOUND', `Import run '${importRunId}' disappeared during update.`);
      await this.appendAudit(client, context, 'admin.import.annotate', 'source_import_run', importRunId, before, after);
      return after;
    });
  }

  private async withMutation<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async lockSourceState(client: PoolClient, sourceKey: string) {
    const result = await client.query<JsonStateRow>(
      `SELECT jsonb_build_object(
         'sourceKey', source_key,
         'name', name,
         'sourceType', source_type,
         'homepageUrl', homepage_url,
         'licenseCode', license_code,
         'isActive', is_active,
         'metadata', metadata
       ) AS state
       FROM data_sources WHERE source_key = $1 FOR UPDATE`,
      [sourceKey],
    );
    return result.rows[0]?.state ?? null;
  }

  private async lockStationState(client: PoolClient, publicId: string) {
    const result = await client.query<JsonStateRow>(
      `SELECT jsonb_build_object(
         'id', public_id,
         'name', name,
         'stationType', station_type,
         'timeZone', time_zone,
         'latitude', ST_Y(location),
         'longitude', ST_X(location),
         'defaultDatumId', default_datum_id,
         'metadata', metadata
       ) AS state
       FROM stations WHERE public_id = $1 FOR UPDATE`,
      [publicId],
    );
    return result.rows[0]?.state ?? null;
  }

  private async lockImportState(client: PoolClient, importRunId: string) {
    const result = await client.query<JsonStateRow>(
      `SELECT jsonb_build_object(
         'id', id::text,
         'idempotencyKey', idempotency_key,
         'parserVersion', parser_version,
         'normalizerVersion', normalizer_version,
         'status', status,
         'acceptedRecords', accepted_records,
         'rejectedRecords', rejected_records,
         'errorSummary', error_summary,
         'metadata', metadata
       ) AS state
       FROM source_import_runs WHERE id = $1::uuid FOR UPDATE`,
      [importRunId],
    );
    return result.rows[0]?.state ?? null;
  }

  private async appendAudit(
    client: PoolClient,
    context: AdminMutationContext,
    action: string,
    targetType: string,
    targetId: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
  ): Promise<void> {
    await client.query(
      `INSERT INTO audit_log (
         actor_type, actor_id, action, target_type, target_id, correlation_id,
         before_state, after_state, metadata
       ) VALUES (
         'ADMIN', $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb
       )`,
      [
        context.actor.actorId,
        action,
        targetType,
        targetId,
        context.correlationId,
        JSON.stringify(beforeState),
        JSON.stringify(afterState),
        JSON.stringify({
          role: context.actor.role,
          requestMethod: context.requestMethod,
          requestPath: context.requestPath,
        }),
      ],
    );
  }
}
