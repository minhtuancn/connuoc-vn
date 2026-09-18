import type {
  Coordinate,
  DeploymentUse,
  RainfallProductKind,
  RainfallRecord,
} from '@connuoc/shared-types';
import {
  SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS,
  deriveRainfallAccumulations,
} from '@connuoc/weather-worker';

import {
  RainfallOrchestrationError,
  type RainfallOrchestrationRequest,
  type RainfallOrchestrationResult,
} from './rainfall-orchestrator.js';
import type { RainfallRepository } from './rainfall.repository.js';

const HISTORY_DISTANCE_KM = 25;
const SUMMARY_HISTORY_LIMIT = 5_000;
const DERIVATION_VERSION = 'rainfall-accum-v1';

export class RainfallUnavailableError extends Error {
  readonly code = 'RAINFALL_UNAVAILABLE' as const;

  constructor() {
    super('Rainfall data is temporarily unavailable.');
    this.name = 'RainfallUnavailableError';
  }
}

export type PublicRainfallRecord = Omit<RainfallRecord, 'source'> & {
  readonly source: Omit<RainfallRecord['source'], 'providerConfigId'>;
};

export interface RainfallHistoryResponse {
  readonly records: readonly PublicRainfallRecord[];
}

export interface RainfallSummaryWindow {
  readonly windowSeconds: number;
  readonly amountMm: number | null;
  readonly coverageRatio: number;
  readonly complete: boolean;
  readonly derivationVersion: string;
  readonly inputRecordIds: readonly string[];
  readonly productKinds: readonly RainfallProductKind[];
  readonly sourceIds: readonly string[];
}

export interface RainfallSummaryResponse {
  readonly at: string;
  readonly windows: readonly RainfallSummaryWindow[];
}

export interface RainfallForecastResponse {
  readonly freshness: {
    readonly state: 'FRESH' | 'STALE';
    readonly staleAfter: string;
  };
  readonly fallbackUsed: boolean;
  readonly lastKnownGoodUsed: boolean;
  readonly records: readonly PublicRainfallRecord[];
}

interface RainfallOrchestratorPort {
  fetch(request: RainfallOrchestrationRequest): Promise<RainfallOrchestrationResult>;
}

interface RainfallRepositoryPort {
  saveBundle(
    providerConfigId: string,
    bundle: RainfallOrchestrationResult['bundle'],
    staleAfterUtc: string,
  ): Promise<string>;
  findHistory(query: Parameters<RainfallRepository['findHistory']>[0]): Promise<RainfallRecord[]>;
}

function compactInstant(date: Date): string {
  const value = date.toISOString();
  return value.endsWith('.000Z') ? value.replace('.000Z', 'Z') : value;
}

function publicRecord(record: RainfallRecord): PublicRainfallRecord {
  const { providerConfigId: _providerConfigId, ...source } = record.source;
  return {
    ...record,
    source,
  };
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function seriesKey(record: RainfallRecord): string {
  return JSON.stringify([
    record.productKind,
    record.spatial.representation,
    record.spatial.latitude,
    record.spatial.longitude,
    record.spatial.resolutionKm,
    record.spatial.stationId,
    record.source.sourceId,
    record.source.productId,
    record.source.productVersion,
  ]);
}

function selectCompatibleSeries(records: readonly RainfallRecord[]): RainfallRecord[] {
  const groups = new Map<string, Map<string, RainfallRecord>>();
  for (const record of records) {
    const key = seriesKey(record);
    let group = groups.get(key);
    if (!group) {
      group = new Map<string, RainfallRecord>();
      groups.set(key, group);
    }
    if (!group.has(record.id)) group.set(record.id, record);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const values = [...group.values()].sort(
        (left, right) =>
          Date.parse(left.validStart) - Date.parse(right.validStart) ||
          Date.parse(left.validEnd) - Date.parse(right.validEnd) ||
          left.id.localeCompare(right.id),
      );
      return {
        key,
        values,
        coverageSeconds: values.reduce(
          (total, record) => total + record.accumulationSeconds,
          0,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.coverageSeconds - left.coverageSeconds ||
        left.key.localeCompare(right.key),
    )[0]?.values ?? [];
}

function deduplicateRecords(records: readonly RainfallRecord[]): RainfallRecord[] {
  const seen = new Set<string>();
  const result: RainfallRecord[] = [];
  for (const record of records) {
    const key = [
      record.id,
      record.productKind,
      record.source.sourceId,
      record.source.productId,
      record.source.productVersion ?? '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function latestFetchedAt(records: readonly RainfallRecord[]): string {
  if (records.length === 0) throw new RangeError('rainfall bundle has no records');
  return records.reduce(
    (latest, record) =>
      Date.parse(record.source.fetchedAt) > Date.parse(latest)
        ? record.source.fetchedAt
        : latest,
    records[0]!.source.fetchedAt,
  );
}

function staleAfter(
  records: readonly RainfallRecord[],
  freshnessSeconds: number,
): string {
  const fetchedAtMs = Date.parse(latestFetchedAt(records));
  if (!Number.isFinite(fetchedAtMs)) {
    throw new RangeError('Rainfall source fetchedAt is invalid.');
  }
  return compactInstant(new Date(fetchedAtMs + freshnessSeconds * 1000));
}

export class RainfallService {
  constructor(
    private readonly orchestrator: RainfallOrchestratorPort,
    private readonly repository: RainfallRepositoryPort,
    private readonly deploymentUse: DeploymentUse = 'COMMERCIAL',
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getHistory(
    coordinate: Coordinate,
    startUtc: string,
    endUtc: string,
    limit: number,
  ): Promise<RainfallHistoryResponse> {
    const records = await this.repository.findHistory({
      coordinate,
      startUtc,
      endUtc,
      maxDistanceKm: HISTORY_DISTANCE_KM,
      limit,
    });
    return {
      records: deduplicateRecords(records).map(publicRecord),
    };
  }

  async getSummary(
    coordinate: Coordinate,
    atUtc: string,
  ): Promise<RainfallSummaryResponse> {
    const atMs = Date.parse(atUtc);
    if (!Number.isFinite(atMs)) throw new RangeError('atUtc must be a valid instant');

    const startUtc = compactInstant(
      new Date(
        atMs -
          SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS[
            SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS.length - 1
          ]! *
            1000,
      ),
    );
    const history = await this.repository.findHistory({
      coordinate,
      startUtc,
      endUtc: atUtc,
      maxDistanceKm: HISTORY_DISTANCE_KM,
      limit: SUMMARY_HISTORY_LIMIT,
    });
    const records = selectCompatibleSeries(history);
    if (records.length === 0) return { at: atUtc, windows: [] };

    const byId = new Map(records.map((record) => [record.id, record]));
    const accumulations = deriveRainfallAccumulations(
      records,
      atUtc,
      SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS,
      DERIVATION_VERSION,
    );

    return {
      at: atUtc,
      windows: accumulations.map((accumulation) => ({
        ...accumulation,
        productKinds: uniqueSorted(
          accumulation.inputRecordIds.flatMap((recordId) => {
            const record = byId.get(recordId);
            return record ? [record.productKind] : [];
          }),
        ),
      })),
    };
  }

  async getForecast(
    coordinate: Coordinate,
    hours: number,
  ): Promise<RainfallForecastResponse> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) throw new RangeError('now must be a valid Date');

    let result: RainfallOrchestrationResult;
    try {
      result = await this.orchestrator.fetch({
        capability: 'rainfall.forecast',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        hours,
        atUtc: now.toISOString(),
        deploymentUse: this.deploymentUse,
      });
    } catch (error) {
      if (
        error instanceof RainfallOrchestrationError &&
        error.code === 'NO_PROVIDER_AVAILABLE'
      ) {
        throw new RainfallUnavailableError();
      }
      if (
        error instanceof RainfallOrchestrationError &&
        error.code === 'INVALID_REQUEST'
      ) {
        throw new RangeError('Rainfall forecast request is invalid.');
      }
      throw error;
    }

    const staleAfterUtc = staleAfter(result.bundle.records, result.freshnessSeconds);
    if (!result.lastKnownGoodUsed) {
      await this.repository.saveBundle(
        result.providerConfigId,
        result.bundle,
        staleAfterUtc,
      );
    }

    return {
      freshness: {
        state: result.lastKnownGoodUsed ? 'STALE' : 'FRESH',
        staleAfter: staleAfterUtc,
      },
      fallbackUsed: result.fallbackUsed,
      lastKnownGoodUsed: result.lastKnownGoodUsed,
      records: result.bundle.records.map(publicRecord),
    };
  }
}
