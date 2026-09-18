import { createHash } from 'node:crypto';

import {
  RainfallRecordSchema,
  type Coordinate,
  type RainfallRecord,
} from '@connuoc/shared-types';
import type {
  DerivedRainfallAccumulation,
  NormalizedRainfallBundle,
  RainfallObjectReference,
  RainfallProviderCapability,
} from '@connuoc/weather-worker';
import type { Pool, PoolClient } from 'pg';

export interface RainfallHistoryQuery {
  readonly coordinate: Coordinate;
  readonly startUtc: string;
  readonly endUtc: string;
  readonly maxDistanceKm: number;
  readonly limit: number;
}

export interface RainfallLastKnownGoodQuery {
  readonly capability: RainfallProviderCapability;
  readonly coordinate: Coordinate;
  readonly atUtc: string;
  readonly maxDistanceKm: number;
  readonly staleGraceSeconds: number;
}

export interface RainfallLastKnownGoodResult {
  readonly runId: string;
  readonly providerConfigId: string;
  readonly freshnessSeconds: number;
  readonly staleAfterUtc: string;
  readonly distanceKm: number;
  readonly bundle: NormalizedRainfallBundle;
}

interface RainfallRunRow {
  id: string;
  provider_config_id: string;
  source_registry_id: string;
  capability: RainfallProviderCapability;
  spatial_representation: RainfallRecord['spatial']['representation'];
  latitude: number | string;
  longitude: number | string;
  resolution_km: number | string | null;
  station_public_id: string | null;
  product_id: string;
  product_version: string | null;
  model_run_at: Date | string | null;
  fetched_at: Date | string;
  stale_after: Date | string;
  attribution_text: string;
  attribution_url: string | null;
  object_references: unknown;
  distance_km: number | string;
}

interface RainfallRecordRow {
  external_record_id: string;
  product_kind: RainfallRecord['productKind'];
  valid_start: Date | string;
  valid_end: Date | string;
  accumulation_seconds: number;
  amount_mm: number | string;
  quality_state: RainfallRecord['quality']['state'];
  quality_flags: string[];
  source_registry_id: string;
  product_id: string;
  product_version: string | null;
  model_run_at: Date | string | null;
  observed_at: Date | string | null;
  fetched_at: Date | string;
  attribution_text: string;
  attribution_url: string | null;
}

interface RainfallHistoryRow extends RainfallRecordRow {
  provider_config_id: string;
  spatial_representation: RainfallRecord['spatial']['representation'];
  latitude: number | string;
  longitude: number | string;
  resolution_km: number | string | null;
  station_public_id: string | null;
  distance_km: number | string;
}

function databaseError(message: string): Error {
  return new Error(message);
}

function compactInstant(value: Date | string): string {
  const instant = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  return instant.endsWith('.000Z') ? instant.replace('.000Z', 'Z') : instant;
}

function numberValue(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function nullableNumber(value: number | string | null): number | null {
  return value === null ? null : numberValue(value);
}

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

function assertCoordinate(coordinate: Coordinate): void {
  if (
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90 ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    throw new RangeError('coordinate is outside valid latitude/longitude bounds');
  }
}

function assertDistance(value: number): void {
  if (!Number.isFinite(value) || value <= 0 || value > 500) {
    throw new RangeError('maxDistanceKm must be greater than 0 and at most 500');
  }
}

function assertInstant(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError(`${field} must be a valid ISO instant`);
  }
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

function objectReferences(value: unknown): RainfallObjectReference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.uri !== 'string' || candidate.uri.length === 0) return [];
    return [{
      uri: candidate.uri,
      checksumSha256:
        typeof candidate.checksumSha256 === 'string' ? candidate.checksumSha256 : null,
      mediaType: typeof candidate.mediaType === 'string' ? candidate.mediaType : null,
    }];
  });
}

function recordFromRows(
  run: Pick<
    RainfallRunRow,
    | 'provider_config_id'
    | 'spatial_representation'
    | 'latitude'
    | 'longitude'
    | 'resolution_km'
    | 'station_public_id'
  >,
  row: RainfallRecordRow,
): RainfallRecord {
  return RainfallRecordSchema.parse({
    id: row.external_record_id,
    productKind: row.product_kind,
    validStart: compactInstant(row.valid_start),
    validEnd: compactInstant(row.valid_end),
    accumulationSeconds: row.accumulation_seconds,
    amountMm: numberValue(row.amount_mm),
    unit: 'mm',
    spatial: {
      representation: run.spatial_representation,
      latitude: numberValue(run.latitude),
      longitude: numberValue(run.longitude),
      resolutionKm: nullableNumber(run.resolution_km),
      stationId: run.station_public_id,
    },
    quality: {
      state: row.quality_state,
      flags: row.quality_flags ?? [],
    },
    source: {
      sourceId: row.source_registry_id,
      providerConfigId: run.provider_config_id,
      productId: row.product_id,
      productVersion: row.product_version,
      modelRunAt: row.model_run_at === null ? null : compactInstant(row.model_run_at),
      observedAt: row.observed_at === null ? null : compactInstant(row.observed_at),
      fetchedAt: compactInstant(row.fetched_at),
      attributionText: row.attribution_text,
      attributionUrl: row.attribution_url,
    },
  });
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
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) throw databaseError('Rainfall database is not configured.');
    return this.pool;
  }

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
    const storedObjectReferences = [...(bundle.objectReferences ?? [])].sort((left, right) =>
      left.uri.localeCompare(right.uri),
    );
    const objectUris = storedObjectReferences.map((reference) => reference.uri);
    const modelRuns = bundle.records
      .map((record) => record.source.modelRunAt)
      .filter((instant): instant is string => instant !== null);
    const modelRunAt = modelRuns.length === 0 ? null : latestInstant(modelRuns);

    const client = await this.database().connect();
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
          JSON.stringify(storedObjectReferences),
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
    const client = await this.database().connect();
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

  async findHistory(query: RainfallHistoryQuery): Promise<RainfallRecord[]> {
    assertCoordinate(query.coordinate);
    assertDistance(query.maxDistanceKm);
    assertInstant(query.startUtc, 'startUtc');
    assertInstant(query.endUtc, 'endUtc');
    if (Date.parse(query.endUtc) <= Date.parse(query.startUtc)) {
      throw new RangeError('endUtc must be later than startUtc');
    }
    if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 5_000) {
      throw new RangeError('limit must be an integer between 1 and 5000');
    }

    const result = await this.database().query<RainfallHistoryRow>(
      `SELECT
         rr.external_record_id,
         rr.product_kind,
         rr.valid_start,
         rr.valid_end,
         rr.accumulation_seconds,
         rr.amount_mm,
         rr.quality_state,
         rr.quality_flags,
         rr.source_registry_id,
         rr.product_id,
         rr.product_version,
         rr.model_run_at,
         rr.observed_at,
         rr.fetched_at,
         rr.attribution_text,
         rr.attribution_url,
         r.provider_config_id::text AS provider_config_id,
         r.spatial_representation,
         ST_Y(r.spatial_point::geometry) AS latitude,
         ST_X(r.spatial_point::geometry) AS longitude,
         r.resolution_km,
         r.station_public_id,
         ST_Distance(
           r.spatial_point,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) / 1000.0 AS distance_km
       FROM rainfall_records rr
       JOIN rainfall_runs r ON r.id = rr.rainfall_run_id
       WHERE r.capability <> 'rainfall.forecast'
         AND rr.valid_start >= $3::timestamptz
         AND rr.valid_end <= $4::timestamptz
         AND ST_DWithin(
           r.spatial_point,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $5 * 1000.0
         )
       ORDER BY distance_km ASC, rr.valid_start ASC, rr.valid_end ASC, rr.external_record_id ASC
       LIMIT $6`,
      [
        query.coordinate.latitude,
        query.coordinate.longitude,
        query.startUtc,
        query.endUtc,
        query.maxDistanceKm,
        query.limit,
      ],
    );

    return result.rows.map((row) =>
      recordFromRows(
        {
          provider_config_id: row.provider_config_id,
          spatial_representation: row.spatial_representation,
          latitude: row.latitude,
          longitude: row.longitude,
          resolution_km: row.resolution_km,
          station_public_id: row.station_public_id,
        },
        row,
      ),
    );
  }

  async findNearestLastKnownGood(
    query: RainfallLastKnownGoodQuery,
  ): Promise<RainfallLastKnownGoodResult | null> {
    assertCoordinate(query.coordinate);
    assertDistance(query.maxDistanceKm);
    assertInstant(query.atUtc, 'atUtc');
    if (
      !Number.isInteger(query.staleGraceSeconds) ||
      query.staleGraceSeconds < 0 ||
      query.staleGraceSeconds > 31_536_000
    ) {
      throw new RangeError('staleGraceSeconds must be an integer between 0 and 31536000');
    }

    const runResult = await this.database().query<RainfallRunRow>(
      `SELECT
         r.id::text AS id,
         r.provider_config_id::text AS provider_config_id,
         r.source_registry_id,
         r.capability,
         r.spatial_representation,
         ST_Y(r.spatial_point::geometry) AS latitude,
         ST_X(r.spatial_point::geometry) AS longitude,
         r.resolution_km,
         r.station_public_id,
         r.product_id,
         r.product_version,
         r.model_run_at,
         r.fetched_at,
         r.stale_after,
         r.attribution_text,
         r.attribution_url,
         r.object_references,
         ST_Distance(
           r.spatial_point,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) / 1000.0 AS distance_km
       FROM rainfall_runs r
       WHERE r.capability = $3
         AND r.fetched_at <= $4::timestamptz
         AND r.stale_after + ($6 * INTERVAL '1 second') >= $4::timestamptz
         AND ST_DWithin(
           r.spatial_point,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $5 * 1000.0
         )
       ORDER BY distance_km ASC, r.fetched_at DESC, r.id ASC
       LIMIT 1`,
      [
        query.coordinate.latitude,
        query.coordinate.longitude,
        query.capability,
        query.atUtc,
        query.maxDistanceKm,
        query.staleGraceSeconds,
      ],
    );
    const run = runResult.rows[0];
    if (!run) return null;

    const recordsResult = await this.database().query<RainfallRecordRow>(
      `SELECT
         external_record_id,
         product_kind,
         valid_start,
         valid_end,
         accumulation_seconds,
         amount_mm,
         quality_state,
         quality_flags,
         source_registry_id,
         product_id,
         product_version,
         model_run_at,
         observed_at,
         fetched_at,
         attribution_text,
         attribution_url
       FROM rainfall_records
       WHERE rainfall_run_id = $1
       ORDER BY valid_start ASC, valid_end ASC, external_record_id ASC`,
      [run.id],
    );
    if (recordsResult.rows.length === 0) {
      throw databaseError('Cached rainfall run has no records.');
    }

    const records = recordsResult.rows.map((row) => recordFromRows(run, row));
    const refs = objectReferences(run.object_references);
    const staleAfterUtc = compactInstant(run.stale_after);
    const freshnessSeconds = Math.max(
      0,
      Math.round(
        (Date.parse(staleAfterUtc) - Date.parse(compactInstant(run.fetched_at))) / 1000,
      ),
    );

    return {
      runId: run.id,
      providerConfigId: run.provider_config_id,
      freshnessSeconds,
      staleAfterUtc,
      distanceKm: numberValue(run.distance_km),
      bundle: {
        capability: run.capability,
        records,
        ...(refs.length === 0 ? {} : { objectReferences: refs }),
      },
    };
  }
}
