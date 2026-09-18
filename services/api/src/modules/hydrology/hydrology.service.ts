import type {
  DeploymentUse,
  HydrologyDischargeRecord,
  HydrologyReturnPeriodRecord,
} from '@connuoc/shared-types';

import {
  HydrologyOrchestrationError,
  type HydrologyNormalizedBundle,
  type HydrologyOrchestrationRequest,
  type HydrologyOrchestrationResult,
} from './hydrology-orchestrator.js';
import type { HydrologyRepository } from './hydrology.repository.js';
import type {
  MappedProviderMetadata,
  RiverReachRepository,
} from './river-reach.repository.js';

export class HydrologyUnavailableError extends Error {
  readonly code = 'HYDROLOGY_UNAVAILABLE' as const;

  constructor() {
    super('Hydrology data is temporarily unavailable.');
    this.name = 'HydrologyUnavailableError';
  }
}

export class RiverReachNotFoundError extends Error {
  readonly code = 'RIVER_REACH_NOT_FOUND' as const;

  constructor(readonly riverReachId: string) {
    super('River reach was not found.');
    this.name = 'RiverReachNotFoundError';
  }
}

export interface PublicHydrologySource {
  readonly sourceId: string;
  readonly productId: string;
  readonly productVersion: string | null;
  readonly fetchedAt: string;
  readonly attributionText: string;
  readonly attributionUrl: string | null;
}

export type PublicHydrologyDischargeRecord = Omit<
  HydrologyDischargeRecord,
  'source'
> & {
  readonly source: PublicHydrologySource;
};

export type PublicHydrologyReturnPeriodRecord = Omit<
  HydrologyReturnPeriodRecord,
  'source'
> & {
  readonly source: PublicHydrologySource;
};

export interface PublicRiverMapping {
  readonly state: 'MAPPED';
  readonly providerReachId: string;
  readonly method: MappedProviderMetadata['method'];
  readonly confidence: number;
  readonly distanceKm: number | null;
}

export interface PublicNearbyRiver {
  readonly id: string;
  readonly name: string;
  readonly riverId: string | null;
  readonly basinId: string | null;
  readonly distanceKm: number;
  readonly mapping: {
    readonly state: 'MAPPED' | 'AMBIGUOUS' | 'UNMAPPED';
    readonly bestConfidence: number | null;
    readonly mappedProviderCount: number;
    readonly candidateCount: number;
  };
}

export interface NearbyRiversResponse {
  readonly reaches: readonly PublicNearbyRiver[];
}

export interface RiverForecastResponse {
  readonly reachId: string;
  readonly unit: 'm3/s';
  readonly trend: 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
  readonly freshness: {
    readonly state: 'FRESH' | 'STALE';
    readonly staleAfter: string;
  };
  readonly fallbackUsed: boolean;
  readonly lastKnownGoodUsed: boolean;
  readonly mapping: PublicRiverMapping;
  readonly records: readonly PublicHydrologyDischargeRecord[];
  readonly returnPeriods: readonly PublicHydrologyReturnPeriodRecord[];
  readonly returnPeriodFreshness: {
    readonly state: 'FRESH' | 'STALE';
    readonly staleAfter: string;
  } | null;
}

interface HydrologyOrchestratorPort {
  fetch(
    request: HydrologyOrchestrationRequest,
  ): Promise<HydrologyOrchestrationResult>;
}

interface HydrologyRepositoryPort {
  saveBundle: HydrologyRepository['saveBundle'];
  saveReturnPeriods: HydrologyRepository['saveReturnPeriods'];
}

interface RiverReachRepositoryPort {
  findNearby: RiverReachRepository['findNearby'];
  findByPublicId: RiverReachRepository['findByPublicId'];
  findMappingSummary: RiverReachRepository['findMappingSummary'];
  findMappedProviderMetadata:
    RiverReachRepository['findMappedProviderMetadata'];
}

function compactInstant(date: Date): string {
  const value = date.toISOString();
  return value.endsWith('.000Z')
    ? value.replace('.000Z', 'Z')
    : value;
}

function utcDayStart(date: Date): string {
  return compactInstant(
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
      ),
    ),
  );
}

function publicSource(
  source:
    | HydrologyDischargeRecord['source']
    | HydrologyReturnPeriodRecord['source'],
): PublicHydrologySource {
  return {
    sourceId: source.sourceId,
    productId: source.productId,
    productVersion: source.productVersion,
    fetchedAt: source.fetchedAt,
    attributionText: source.attributionText,
    attributionUrl: source.attributionUrl,
  };
}

function publicDischargeRecord(
  record: HydrologyDischargeRecord,
): PublicHydrologyDischargeRecord {
  return {
    ...record,
    source: publicSource(record.source),
  };
}

function publicReturnPeriod(
  record: HydrologyReturnPeriodRecord,
): PublicHydrologyReturnPeriodRecord {
  return {
    ...record,
    source: publicSource(record.source),
  };
}

function latestFetchedAt(bundle: HydrologyNormalizedBundle): string {
  if (bundle.records.length === 0) {
    throw new RangeError('hydrology bundle has no records');
  }
  return bundle.records.reduce(
    (latest, record) =>
      Date.parse(record.source.fetchedAt) > Date.parse(latest)
        ? record.source.fetchedAt
        : latest,
    bundle.records[0]!.source.fetchedAt,
  );
}

function staleAfter(
  bundle: HydrologyNormalizedBundle,
  freshnessSeconds: number,
): string {
  const fetchedAt = latestFetchedAt(bundle);
  const fetchedMs = Date.parse(fetchedAt);
  if (
    !Number.isFinite(fetchedMs) ||
    !Number.isInteger(freshnessSeconds) ||
    freshnessSeconds < 0
  ) {
    throw new RangeError('hydrology freshness metadata is invalid');
  }
  return compactInstant(
    new Date(fetchedMs + freshnessSeconds * 1000),
  );
}

function trend(
  records: readonly HydrologyDischargeRecord[],
): RiverForecastResponse['trend'] {
  const means = records
    .filter(
      (record) => record.productKind === 'FORECAST_MEAN',
    )
    .sort(
      (left, right) =>
        Date.parse(left.validAt) - Date.parse(right.validAt),
    );
  if (means.length < 2) return 'UNKNOWN';

  const first = means[0]!.dischargeCms;
  const last = means[means.length - 1]!.dischargeCms;
  if (last > first) return 'RISING';
  if (last < first) return 'FALLING';
  return 'STABLE';
}

export class HydrologyService {
  constructor(
    private readonly orchestrator: HydrologyOrchestratorPort,
    private readonly repository: HydrologyRepositoryPort,
    private readonly reachRepository: RiverReachRepositoryPort,
    private readonly deploymentUse: DeploymentUse = 'COMMERCIAL',
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number,
  ): Promise<NearbyRiversResponse> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) {
      throw new RangeError('now must be a valid Date');
    }

    const reaches = await this.reachRepository.findNearby({
      latitude,
      longitude,
      radiusKm,
      limit,
    });
    const atUtc = now.toISOString();

    return {
      reaches: await Promise.all(
        reaches.map(async (reach) => {
          const mapping =
            await this.reachRepository.findMappingSummary(
              reach.publicId,
              atUtc,
            );
          return {
            id: reach.publicId,
            name: reach.name,
            riverId: reach.riverPublicId,
            basinId: reach.basinPublicId,
            distanceKm: reach.distanceKm,
            mapping: mapping ?? {
              state: 'UNMAPPED' as const,
              bestConfidence: null,
              mappedProviderCount: 0,
              candidateCount: 0,
            },
          };
        }),
      ),
    };
  }

  async getForecast(
    riverReachId: string,
    days: number,
  ): Promise<RiverForecastResponse> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) {
      throw new RangeError('now must be a valid Date');
    }
    const reach =
      await this.reachRepository.findByPublicId(riverReachId);
    if (!reach) {
      throw new RiverReachNotFoundError(riverReachId);
    }

    const atUtc = now.toISOString();
    let forecast: HydrologyOrchestrationResult;
    try {
      forecast = await this.orchestrator.fetch({
        capability: 'hydrology.dischargeForecast',
        riverReachId,
        latitude: reach.latitude,
        longitude: reach.longitude,
        atUtc,
        modelRunAtUtc: utcDayStart(now),
        days,
        deploymentUse: this.deploymentUse,
      });
    } catch (error) {
      if (
        error instanceof HydrologyOrchestrationError &&
        error.code === 'NO_PROVIDER_AVAILABLE'
      ) {
        throw new HydrologyUnavailableError();
      }
      if (
        error instanceof HydrologyOrchestrationError &&
        error.code === 'INVALID_REQUEST'
      ) {
        throw new RangeError(
          'Hydrology forecast request is invalid.',
        );
      }
      throw error;
    }

    if (
      forecast.bundle.capability !==
      'hydrology.dischargeForecast'
    ) {
      throw new HydrologyUnavailableError();
    }

    const mapped =
      await this.reachRepository.findMappedProviderMetadata({
        riverReachPublicId: riverReachId,
        providerConfigId: forecast.providerConfigId,
        providerReachId: forecast.providerReachId,
        atUtc,
      });
    if (!mapped) {
      throw new HydrologyUnavailableError();
    }

    const forecastStaleAfter = staleAfter(
      forecast.bundle,
      forecast.freshnessSeconds,
    );
    if (!forecast.lastKnownGoodUsed) {
      await this.repository.saveBundle(
        forecast.providerConfigId,
        forecast.bundle,
        forecastStaleAfter,
      );
    }

    const returnPeriodResult =
      await this.fetchReturnPeriodsBestEffort(
        reach,
        riverReachId,
        atUtc,
      );

    return {
      reachId: riverReachId,
      unit: 'm3/s',
      trend: trend(forecast.bundle.records),
      freshness: {
        state: forecast.lastKnownGoodUsed ? 'STALE' : 'FRESH',
        staleAfter: forecastStaleAfter,
      },
      fallbackUsed: forecast.fallbackUsed,
      lastKnownGoodUsed: forecast.lastKnownGoodUsed,
      mapping: {
        state: 'MAPPED',
        providerReachId: forecast.providerReachId,
        method: mapped.method,
        confidence: mapped.confidence,
        distanceKm: mapped.distanceKm,
      },
      records: forecast.bundle.records.map(
        publicDischargeRecord,
      ),
      returnPeriods:
        returnPeriodResult?.records.map(publicReturnPeriod) ?? [],
      returnPeriodFreshness:
        returnPeriodResult === null
          ? null
          : {
              state: returnPeriodResult.stale
                ? 'STALE'
                : 'FRESH',
              staleAfter: returnPeriodResult.staleAfter,
            },
    };
  }

  private async fetchReturnPeriodsBestEffort(
    reach: {
      readonly latitude: number;
      readonly longitude: number;
    },
    riverReachId: string,
    atUtc: string,
  ): Promise<{
    readonly records: readonly HydrologyReturnPeriodRecord[];
    readonly stale: boolean;
    readonly staleAfter: string;
  } | null> {
    let result: HydrologyOrchestrationResult;
    try {
      result = await this.orchestrator.fetch({
        capability: 'hydrology.returnPeriods',
        riverReachId,
        latitude: reach.latitude,
        longitude: reach.longitude,
        atUtc,
        deploymentUse: this.deploymentUse,
      });
    } catch (error) {
      if (
        error instanceof HydrologyOrchestrationError &&
        error.code === 'NO_PROVIDER_AVAILABLE'
      ) {
        return null;
      }
      throw error;
    }

    if (result.bundle.capability !== 'hydrology.returnPeriods') {
      return null;
    }

    const staleAfterUtc = staleAfter(
      result.bundle,
      result.freshnessSeconds,
    );
    if (!result.lastKnownGoodUsed) {
      await this.repository.saveReturnPeriods(
        result.providerConfigId,
        result.bundle,
        staleAfterUtc,
      );
    }

    return {
      records: result.bundle.records,
      stale: result.lastKnownGoodUsed,
      staleAfter: staleAfterUtc,
    };
  }
}
