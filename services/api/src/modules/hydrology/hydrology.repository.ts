import { createHash } from 'node:crypto';

import {
  HydrologyDischargeRecordSchema,
  HydrologyReturnPeriodRecordSchema,
  RiverReachResolutionSchema,
  type HydrologyDischargeRecord,
  type HydrologyReturnPeriodRecord,
  type RiverReachResolution,
} from '@connuoc/shared-types';
import type {
  HydrologyProviderCapability,
  NormalizedHydrologyBundle,
  NormalizedHydrologyReturnPeriodBundle,
} from '@connuoc/weather-worker';
import type { Pool, PoolClient } from 'pg';

import type {
  HydrologyLastKnownGoodQuery,
  HydrologyLastKnownGoodResult,
  HydrologyNormalizedBundle,
} from './hydrology-orchestrator.js';

interface ReachIdRow {
  id: string;
}

interface HydrologyRunRow {
  id: string;
  provider_config_id: string;
  provider_key: string;
  river_reach_public_id: string;
  source_registry_id: string;
  capability: HydrologyProviderCapability;
  provider_reach_id: string;
  product_id: string;
  product_version: string | null;
  model_run_at: Date | string | null;
  fetched_at: Date | string;
  stale_after: Date | string;
  attribution_text: string;
  attribution_url: string | null;
  metadata: Record<string, unknown>;
  mapping_method: HydrologyDischargeRecord['mapping']['method'];
  mapping_confidence: number | string;
  mapping_distance_km: number | string | null;
}

interface HydrologyPointRow {
  external_record_id: string;
  product_kind: HydrologyDischargeRecord['productKind'];
  valid_at: Date | string;
  lead_seconds: number | null;
  discharge_cms: number | string;
  ensemble_member: number | null;
  statistic: HydrologyDischargeRecord['statistic'];
  quality_state: HydrologyDischargeRecord['quality']['state'];
  quality_flags: string[];
}

interface ReturnPeriodRow {
  return_period_years: number;
  discharge_cms: number | string;
  retrospective_period_start: Date | string | null;
  retrospective_period_end: Date | string | null;
}

function compactInstant(value: Date | string): string {
  const instant =
    value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  return instant.endsWith('.000Z')
    ? instant.replace('.000Z', 'Z')
    : instant;
}

function nullableInstant(value: Date | string | null): string | null {
  return value === null ? null : compactInstant(value);
}

function numberValue(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function nullableNumber(
  value: number | string | null,
): number | null {
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

function checksum(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function latestInstant(values: readonly string[]): string {
  if (values.length === 0) {
    throw new RangeError('hydrology bundle has no fetch timestamp');
  }
  return values.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest)
      ? candidate
      : latest,
  );
}

function assertStaleAfter(
  fetchedAt: string,
  staleAfterUtc: string,
): void {
  const fetchedMs = Date.parse(fetchedAt);
  const staleMs = Date.parse(staleAfterUtc);
  if (
    !Number.isFinite(fetchedMs) ||
    !Number.isFinite(staleMs) ||
    staleMs < fetchedMs
  ) {
    throw new RangeError(
      'staleAfterUtc must be a valid instant on or after fetchedAt',
    );
  }
}

function storedMapping(
  metadata: Record<string, unknown>,
  fallback: HydrologyDischargeRecord['mapping'],
): HydrologyDischargeRecord['mapping'] {
  const candidate = metadata.mapping;
  if (!candidate || typeof candidate !== 'object') return fallback;
  const mapping = candidate as Record<string, unknown>;
  if (
    mapping.state !== 'MAPPED' ||
    typeof mapping.method !== 'string' ||
    typeof mapping.confidence !== 'number' ||
    (mapping.distanceKm !== null &&
      typeof mapping.distanceKm !== 'number')
  ) {
    return fallback;
  }
  return {
    state: 'MAPPED',
    method:
      mapping.method as HydrologyDischargeRecord['mapping']['method'],
    confidence: mapping.confidence,
    distanceKm: mapping.distanceKm as number | null,
  };
}

function sourceFromRun(run: HydrologyRunRow) {
  return {
    sourceId: run.source_registry_id,
    providerConfigId: run.provider_config_id,
    productId: run.product_id,
    productVersion: run.product_version,
    fetchedAt: compactInstant(run.fetched_at),
    attributionText: run.attribution_text,
    attributionUrl: run.attribution_url,
  };
}

function currentResolution(
  run: HydrologyRunRow,
): RiverReachResolution {
  return RiverReachResolutionSchema.parse({
    state: 'MAPPED',
    providerKey: run.provider_key,
    selectedProviderReachId: run.provider_reach_id,
    candidates: [
      {
        providerReachId: run.provider_reach_id,
        confidence: numberValue(run.mapping_confidence),
        distanceKm: nullableNumber(run.mapping_distance_km),
      },
    ],
  });
}

function assertSeriesBundle(
  providerConfigId: string,
  bundle: NormalizedHydrologyBundle,
): HydrologyDischargeRecord {
  if (bundle.records.length === 0) {
    throw new RangeError('hydrology bundle must contain at least one record');
  }
  const first = bundle.records[0]!;
  if (first.mapping.state !== 'MAPPED') {
    throw new RangeError('hydrology persistence requires a mapped reach');
  }

  for (const record of bundle.records) {
    if (
      record.riverReachId !== first.riverReachId ||
      record.providerReachId !== first.providerReachId ||
      record.source.sourceId !== first.source.sourceId ||
      record.source.productId !== first.source.productId ||
      record.source.productVersion !== first.source.productVersion ||
      record.source.attributionText !==
        first.source.attributionText ||
      record.source.attributionUrl !== first.source.attributionUrl ||
      record.modelRunAt !== first.modelRunAt
    ) {
      throw new RangeError(
        'hydrology bundle must share one reach, product and model run',
      );
    }
    if (
      record.source.providerConfigId !== null &&
      record.source.providerConfigId !== providerConfigId
    ) {
      throw new RangeError(
        'hydrology bundle providerConfigId does not match persistence target',
      );
    }
  }
  return first;
}

function assertReturnPeriodBundle(
  providerConfigId: string,
  bundle: NormalizedHydrologyReturnPeriodBundle,
): HydrologyReturnPeriodRecord {
  if (bundle.records.length === 0) {
    throw new RangeError(
      'hydrology return-period bundle must contain at least one record',
    );
  }
  const first = bundle.records[0]!;
  if (first.mapping.state !== 'MAPPED') {
    throw new RangeError(
      'hydrology return-period persistence requires a mapped reach',
    );
  }

  for (const record of bundle.records) {
    if (
      record.riverReachId !== first.riverReachId ||
      record.providerReachId !== first.providerReachId ||
      record.source.sourceId !== first.source.sourceId ||
      record.source.productId !== first.source.productId ||
      record.source.productVersion !== first.source.productVersion ||
      record.source.attributionText !==
        first.source.attributionText ||
      record.source.attributionUrl !== first.source.attributionUrl
    ) {
      throw new RangeError(
        'return-period bundle must share one reach and source product',
      );
    }
    if (
      record.source.providerConfigId !== null &&
      record.source.providerConfigId !== providerConfigId
    ) {
      throw new RangeError(
        'return-period providerConfigId does not match persistence target',
      );
    }
  }
  return first;
}

export class HydrologyRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('Hydrology database is not configured.');
    }
    return this.pool;
  }

  async saveBundle(
    providerConfigId: string,
    bundle: NormalizedHydrologyBundle,
    staleAfterUtc: string,
  ): Promise<string> {
    const first = assertSeriesBundle(providerConfigId, bundle);
    const fetchedAt = latestInstant(
      bundle.records.map((record) => record.source.fetchedAt),
    );
    assertStaleAfter(fetchedAt, staleAfterUtc);

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const reachId = await this.reachId(
        client,
        first.riverReachId,
      );
      const runId = await this.insertRun(client, {
        providerConfigId,
        reachId,
        sourceRegistryId: first.source.sourceId,
        capability: bundle.capability,
        providerReachId: first.providerReachId,
        productId: first.source.productId,
        productVersion: first.source.productVersion,
        modelRunAt: first.modelRunAt,
        fetchedAt,
        staleAfterUtc,
        attributionText: first.source.attributionText,
        attributionUrl: first.source.attributionUrl,
        normalizedChecksum: checksum(bundle),
        metadata: {
          recordCount: bundle.records.length,
          mapping: first.mapping,
        },
      });

      for (const record of bundle.records) {
        await client.query(
          `INSERT INTO hydrology_discharge_points (
             hydrology_run_id, external_record_id, product_kind,
             valid_at, lead_seconds, discharge_cms, unit,
             ensemble_member, statistic, quality_state, quality_flags
           ) VALUES (
             $1, $2, $3, $4, $5, $6, 'm3/s',
             $7, $8, $9, $10
           )
           ON CONFLICT (hydrology_run_id, external_record_id)
           DO NOTHING`,
          [
            runId,
            record.id,
            record.productKind,
            record.validAt,
            record.leadSeconds,
            record.dischargeCms,
            record.ensembleMember,
            record.statistic,
            record.quality.state,
            [...record.quality.flags],
          ],
        );
      }

      await client.query('COMMIT');
      return runId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveReturnPeriods(
    providerConfigId: string,
    bundle: NormalizedHydrologyReturnPeriodBundle,
    staleAfterUtc: string,
  ): Promise<string> {
    const first = assertReturnPeriodBundle(
      providerConfigId,
      bundle,
    );
    const fetchedAt = latestInstant(
      bundle.records.map((record) => record.source.fetchedAt),
    );
    assertStaleAfter(fetchedAt, staleAfterUtc);

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const reachId = await this.reachId(
        client,
        first.riverReachId,
      );
      const runId = await this.insertRun(client, {
        providerConfigId,
        reachId,
        sourceRegistryId: first.source.sourceId,
        capability: 'hydrology.returnPeriods',
        providerReachId: first.providerReachId,
        productId: first.source.productId,
        productVersion: first.source.productVersion,
        modelRunAt: null,
        fetchedAt,
        staleAfterUtc,
        attributionText: first.source.attributionText,
        attributionUrl: first.source.attributionUrl,
        normalizedChecksum: checksum(bundle),
        metadata: {
          recordCount: bundle.records.length,
          mapping: first.mapping,
        },
      });

      for (const record of bundle.records) {
        await client.query(
          `INSERT INTO hydrology_return_periods (
             hydrology_run_id, return_period_years, discharge_cms,
             unit, retrospective_period_start,
             retrospective_period_end
           ) VALUES ($1, $2, $3, 'm3/s', $4, $5)
           ON CONFLICT (hydrology_run_id, return_period_years)
           DO NOTHING`,
          [
            runId,
            record.returnPeriodYears,
            record.dischargeCms,
            record.retrospectivePeriodStart,
            record.retrospectivePeriodEnd,
          ],
        );
      }

      await client.query('COMMIT');
      return runId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findLastKnownGood(
    query: HydrologyLastKnownGoodQuery,
  ): Promise<HydrologyLastKnownGoodResult | null> {
    if (query.riverReachPublicId.trim().length === 0) {
      throw new RangeError(
        'riverReachPublicId must not be empty',
      );
    }
    if (!Number.isFinite(Date.parse(query.atUtc))) {
      throw new RangeError('atUtc must be a valid ISO instant');
    }
    if (
      !Number.isInteger(query.staleGraceSeconds) ||
      query.staleGraceSeconds < 0 ||
      query.staleGraceSeconds > 31_536_000
    ) {
      throw new RangeError(
        'staleGraceSeconds must be between 0 and 31536000',
      );
    }

    const runResult = await this.database().query<HydrologyRunRow>(
      `SELECT
         h.id::text AS id,
         h.provider_config_id::text AS provider_config_id,
         pc.provider_key,
         rr.public_id AS river_reach_public_id,
         h.source_registry_id,
         h.capability,
         h.provider_reach_id,
         h.product_id,
         h.product_version,
         h.model_run_at,
         h.fetched_at,
         h.stale_after,
         h.attribution_text,
         h.attribution_url,
         h.metadata,
         m.mapping_method,
         m.confidence AS mapping_confidence,
         m.distance_km AS mapping_distance_km
       FROM hydrology_forecast_runs h
       JOIN river_reaches rr ON rr.id = h.river_reach_id
       JOIN provider_configs pc ON pc.id = h.provider_config_id
       JOIN river_reach_provider_mappings m
         ON m.river_reach_id = h.river_reach_id
        AND m.provider_config_id = h.provider_config_id
        AND m.provider_reach_id = h.provider_reach_id
        AND m.mapping_state = 'MAPPED'
        AND m.effective_from <= $3::timestamptz
        AND (m.effective_to IS NULL OR m.effective_to >= $3::timestamptz)
       WHERE rr.public_id = $1
         AND h.capability = $2
         AND h.fetched_at <= $3::timestamptz
         AND h.stale_after + ($4 * INTERVAL '1 second') >= $3::timestamptz
       ORDER BY
         h.fetched_at DESC,
         m.confidence DESC,
         h.id ASC
       LIMIT 1`,
      [
        query.riverReachPublicId,
        query.capability,
        query.atUtc,
        query.staleGraceSeconds,
      ],
    );
    const run = runResult.rows[0];
    if (!run) return null;

    const current = currentResolution(run);
    const fallbackMapping = {
      state: 'MAPPED' as const,
      method: run.mapping_method,
      confidence: numberValue(run.mapping_confidence),
      distanceKm: nullableNumber(run.mapping_distance_km),
    };
    const recordMapping = storedMapping(
      run.metadata ?? {},
      fallbackMapping,
    );

    let bundle: HydrologyNormalizedBundle;
    if (run.capability === 'hydrology.returnPeriods') {
      const result = await this.database().query<ReturnPeriodRow>(
        `SELECT
           return_period_years,
           discharge_cms,
           retrospective_period_start,
           retrospective_period_end
         FROM hydrology_return_periods
         WHERE hydrology_run_id = $1
         ORDER BY return_period_years ASC`,
        [run.id],
      );
      const records = result.rows.map((row) =>
        HydrologyReturnPeriodRecordSchema.parse({
          id: `hydro:cached:${run.provider_reach_id}:return-period:${row.return_period_years}`,
          riverReachId: run.river_reach_public_id,
          providerReachId: run.provider_reach_id,
          mapping: recordMapping,
          returnPeriodYears: row.return_period_years,
          dischargeCms: numberValue(row.discharge_cms),
          unit: 'm3/s',
          retrospectivePeriodStart: nullableInstant(
            row.retrospective_period_start,
          ),
          retrospectivePeriodEnd: nullableInstant(
            row.retrospective_period_end,
          ),
          source: sourceFromRun(run),
        }),
      );
      if (records.length === 0) {
        throw new Error(
          'Cached hydrology return-period run has no records.',
        );
      }
      bundle = {
        capability: 'hydrology.returnPeriods',
        records,
      };
    } else {
      const result = await this.database().query<HydrologyPointRow>(
        `SELECT
           external_record_id,
           product_kind,
           valid_at,
           lead_seconds,
           discharge_cms,
           ensemble_member,
           statistic,
           quality_state,
           quality_flags
         FROM hydrology_discharge_points
         WHERE hydrology_run_id = $1
         ORDER BY valid_at ASC, external_record_id ASC`,
        [run.id],
      );
      const records = result.rows.map((row) =>
        HydrologyDischargeRecordSchema.parse({
          id: row.external_record_id,
          productKind: row.product_kind,
          riverReachId: run.river_reach_public_id,
          providerReachId: run.provider_reach_id,
          mapping: recordMapping,
          validAt: compactInstant(row.valid_at),
          modelRunAt: nullableInstant(run.model_run_at),
          leadSeconds: row.lead_seconds,
          dischargeCms: numberValue(row.discharge_cms),
          unit: 'm3/s',
          ensembleMember: row.ensemble_member,
          statistic: row.statistic,
          quality: {
            state: row.quality_state,
            flags: row.quality_flags ?? [],
          },
          source: sourceFromRun(run),
        }),
      );
      if (records.length === 0) {
        throw new Error(
          'Cached hydrology discharge run has no records.',
        );
      }
      bundle = {
        capability: run.capability,
        records,
      } as NormalizedHydrologyBundle;
    }

    const fetchedAt = compactInstant(run.fetched_at);
    const staleAfterUtc = compactInstant(run.stale_after);
    const freshnessSeconds = Math.max(
      0,
      Math.round(
        (Date.parse(staleAfterUtc) -
          Date.parse(fetchedAt)) /
          1000,
      ),
    );

    return {
      runId: run.id,
      providerConfigId: run.provider_config_id,
      providerReachId: run.provider_reach_id,
      freshnessSeconds,
      staleAfterUtc,
      mapping: current,
      bundle,
    };
  }

  async findForecastRunIdForRecord(query: {
    readonly riverReachPublicId: string;
    readonly externalRecordId: string;
    readonly sourceId: string;
    readonly productId: string;
    readonly productVersion: string | null;
    readonly fetchedAt: string;
  }): Promise<string | null> {
    if (
      query.riverReachPublicId.trim().length === 0 ||
      query.externalRecordId.trim().length === 0 ||
      query.sourceId.trim().length === 0 ||
      query.productId.trim().length === 0 ||
      !Number.isFinite(Date.parse(query.fetchedAt))
    ) {
      throw new RangeError('hydrology forecast run lookup is invalid');
    }

    const result = await this.database().query<{ id: string }>(
      `SELECT h.id::text AS id
       FROM hydrology_forecast_runs h
       JOIN river_reaches rr ON rr.id = h.river_reach_id
       JOIN hydrology_discharge_points p
         ON p.hydrology_run_id = h.id
       WHERE rr.public_id = $1
         AND h.capability = 'hydrology.dischargeForecast'
         AND p.external_record_id = $2
         AND h.source_registry_id = $3
         AND h.product_id = $4
         AND h.product_version IS NOT DISTINCT FROM $5
       ORDER BY
         CASE
           WHEN h.fetched_at = $6::timestamptz THEN 0
           ELSE 1
         END,
         h.created_at DESC,
         h.id ASC
       LIMIT 1`,
      [
        query.riverReachPublicId,
        query.externalRecordId,
        query.sourceId,
        query.productId,
        query.productVersion,
        query.fetchedAt,
      ],
    );
    return result.rows[0]?.id ?? null;
  }

  private async reachId(
    client: PoolClient,
    riverReachPublicId: string,
  ): Promise<string> {
    const result = await client.query<ReachIdRow>(
      `SELECT id::text AS id
       FROM river_reaches
       WHERE public_id = $1`,
      [riverReachPublicId],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new RangeError(
        `Unknown normalized river reach ${riverReachPublicId}`,
      );
    }
    return id;
  }

  private async insertRun(
    client: PoolClient,
    input: {
      readonly providerConfigId: string;
      readonly reachId: string;
      readonly sourceRegistryId: string;
      readonly capability: HydrologyProviderCapability;
      readonly providerReachId: string;
      readonly productId: string;
      readonly productVersion: string | null;
      readonly modelRunAt: string | null;
      readonly fetchedAt: string;
      readonly staleAfterUtc: string;
      readonly attributionText: string;
      readonly attributionUrl: string | null;
      readonly normalizedChecksum: string;
      readonly metadata: Record<string, unknown>;
    },
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `INSERT INTO hydrology_forecast_runs (
         provider_config_id, river_reach_id,
         source_registry_id, capability, provider_reach_id,
         product_id, product_version, model_run_at,
         fetched_at, stale_after, attribution_text,
         attribution_url, normalized_checksum, metadata
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14::jsonb
       )
       ON CONFLICT (
         provider_config_id,
         river_reach_id,
         capability,
         provider_reach_id,
         normalized_checksum
       )
       DO UPDATE SET normalized_checksum =
         EXCLUDED.normalized_checksum
       RETURNING id::text AS id`,
      [
        input.providerConfigId,
        input.reachId,
        input.sourceRegistryId,
        input.capability,
        input.providerReachId,
        input.productId,
        input.productVersion,
        input.modelRunAt,
        input.fetchedAt,
        input.staleAfterUtc,
        input.attributionText,
        input.attributionUrl,
        input.normalizedChecksum,
        JSON.stringify(input.metadata),
      ],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new Error(
        'Hydrology run insert did not return an id.',
      );
    }
    return id;
  }
}
