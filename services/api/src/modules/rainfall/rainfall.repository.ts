import { createHash } from 'node:crypto';

import type {
  DerivedRainfallAccumulation,
  NormalizedRainfallBundle,
} from '@connuoc/weather-worker';
import type { Pool, PoolClient } from 'pg';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function checksumForBundle(bundle: NormalizedRainfallBundle): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(bundle)))
    .digest('hex');
}

function latestInstant(instants: readonly string[]): string {
  return instants.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest) ? candidate : latest,
  );
}

function assertHomogeneousBundle(bundle: NormalizedRainfallBundle): void {
  if (bundle.records.length === 0) {
    throw new RangeError('rainfall bundle must contain at least one record');
  }

  const first = bundle.records[0]!;
  for (const record of bundle.records.slice(1)) {
    if (
      record.spatial.representation !== first.spatial.representation ||
      record.spatial.latitude !== first.spatial.latitude ||
      record.spatial.longitude !== first.spatial.longitude ||
      record.spatial.resolutionKm !== first.spatial.resolutionKm ||
      record.spatial.stationId !== first.spatial.stationId
    ) {
      throw new RangeError('rainfall bundle records must share one normalized spatial footprint');
    }
    if (
      record.source.sourceId !== first.source.sourceId ||
      record.source.productId !== first.source.productId ||
      record.source.productVersion !== first.source.productVersion ||
      record.source.attributionText !== first.source.attributionText ||
      record.source.attributionUrl !== first.source.attributionUrl
    ) {
      throw new RangeError('rainfall bundle records must share one provider product provenance');
    }
  }
}

function assertStaleAfter(fetchedAt: string, staleAfterUtc: string): void {
  const fetchedMs = Date.parse(fetchedAt);
  const staleMs = Date.parse(staleAfterUtc);
  if (!Number.isFinite(staleMs) || staleMs < fetchedMs) {
    throw new RangeError('staleAfterUtc must be a valid instant on or after fetchedAt');
  }
}

async function insertRecords(
  client: PoolClient,
  runId: string,
  bundle: NormalizedRainfallBundle,
): Promise<void> {
  for (const record of bundle.records) {
    await client.query(
      `INSERT INTO rainfall_records (
         rainfall_run_id, external_record_id, product_kind,
         valid_start, valid_end, accumulation_seconds, amount_mm,
         quality_state, quality_flags, source_registry_id,
         product_id, product_version, model_run_at, observed_at, fetched_at,
         attribution_text, attribution_url
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17
       )
       ON CONFLICT (rainfall_run_id, external_record_id) DO NOTHING`,
      [
        runId,
        record.id,
        record.productKind,
        record.validStart,
        record.validEnd,
        record.accumulationSeconds,
        record.amountMm,
        record.quality.state,
        [...record.quality.flags],
        record.source.sourceId,
        record.source.productId,
        record.source.productVersion,
        record.source.modelRunAt,
        record.source.observedAt,
        record.source.fetchedAt,
        record.source.attributionText,
        record.source.attributionUrl,
      ],
    );
  }
}

export class RainfallRepository {
  constructor(private readonly pool: Pool) {}

  async saveBundle(
    providerConfigId: string,
    bundle: NormalizedRainfallBundle,
    staleAfterUtc: string,
  ): Promise<string> {
    assertHomogeneousBundle(bundle);
    const first = bundle.records[0]!;
    const fetchedAt = latestInstant(bundle.records.map((record) => record.source.fetchedAt));
    assertStaleAfter(fetchedAt, staleAfterUtc);

    const checksum = checksumForBundle(bundle);
    const objectReferences = [...(bundle.objectReferences ?? [])].sort((left, right) =>
      left.uri.localeCompare(right.uri),
    );
    const objectUris = objectReferences.map((reference) => reference.uri);
    const modelRuns = bundle.records
      .map((record) => record.source.modelRunAt)
      .filter((instant): instant is string => instant !== null);
    const modelRunAt = modelRuns.length === 0 ? null : latestInstant(modelRuns);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string }>(
        `INSERT INTO rainfall_runs (
           provider_config_id, source_registry_id, capability, spatial_point,
           spatial_representation, resolution_km, station_public_id,
           product_id, product_version, model_run_at, fetched_at, stale_after,
           attribution_text, attribution_url, normalized_checksum,
           object_uris, object_references, metadata
         ) VALUES (
           $1, $2, $3,
           ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
           $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb
         )
         ON CONFLICT (provider_config_id, capability, normalized_checksum)
         DO UPDATE SET normalized_checksum = EXCLUDED.normalized_checksum
         RETURNING id`,
        [
          providerConfigId,
          first.source.sourceId,
          bundle.capability,
          first.spatial.longitude,
          first.spatial.latitude,
          first.spatial.representation,
          first.spatial.resolutionKm,
          first.spatial.stationId,
          first.source.productId,
          first.source.productVersion,
          modelRunAt,
          fetchedAt,
          staleAfterUtc,
          first.source.attributionText,
          first.source.attributionUrl,
          checksum,
          objectUris,
          JSON.stringify(objectReferences),
          JSON.stringify({ recordCount: bundle.records.length }),
        ],
      );
      const runId = result.rows[0]?.id;
      if (!runId) throw new Error('rainfall run insert did not return an id');

      await insertRecords(client, runId, bundle);
      await client.query('COMMIT');
      return runId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveAccumulations(
    runId: string,
    accumulations: readonly DerivedRainfallAccumulation[],
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const accumulation of accumulations) {
        await client.query(
          `INSERT INTO rainfall_accumulations (
             rainfall_run_id, end_at, window_seconds, amount_mm,
             coverage_ratio, complete, derivation_version,
             input_record_ids, source_ids
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (rainfall_run_id, end_at, window_seconds, derivation_version)
           DO UPDATE SET
             amount_mm = EXCLUDED.amount_mm,
             coverage_ratio = EXCLUDED.coverage_ratio,
             complete = EXCLUDED.complete,
             input_record_ids = EXCLUDED.input_record_ids,
             source_ids = EXCLUDED.source_ids`,
          [
            runId,
            accumulation.endUtc,
            accumulation.windowSeconds,
            accumulation.amountMm,
            accumulation.coverageRatio,
            accumulation.complete,
            accumulation.derivationVersion,
            [...accumulation.inputRecordIds],
            [...accumulation.sourceIds],
          ],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
