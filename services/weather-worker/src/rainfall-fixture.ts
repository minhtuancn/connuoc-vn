import { RainfallRecordSchema, type ProviderCapability } from '@connuoc/shared-types';

import type { ProviderContext, ProviderProbeResult } from './contracts.js';
import type {
  NormalizedRainfallBundle,
  RainfallAdapterRequest,
  RainfallProviderAdapter,
} from './rainfall-contracts.js';

export interface FixtureRainfallAdapterOptions {
  readonly context: ProviderContext;
  readonly sourceId: string;
  readonly attributionText: string;
  readonly attributionUrl?: string | null;
  readonly stationId: string;
  readonly now?: () => Date;
}

function compactInstant(value: Date): string {
  return value.toISOString().replace('.000Z', 'Z');
}

function assertCoordinate(request: RainfallAdapterRequest): void {
  if (
    !Number.isFinite(request.latitude) ||
    request.latitude < -90 ||
    request.latitude > 90 ||
    !Number.isFinite(request.longitude) ||
    request.longitude < -180 ||
    request.longitude > 180
  ) {
    throw new RangeError('Fixture rainfall request coordinate is invalid');
  }
}

export class FixtureRainfallAdapter implements RainfallProviderAdapter {
  readonly providerType = 'fixture';
  readonly context: ProviderContext;

  private readonly capabilities: ReadonlySet<ProviderCapability>;
  private readonly sourceId: string;
  private readonly attributionText: string;
  private readonly attributionUrl: string | null;
  private readonly stationId: string;
  private readonly now: () => Date;

  constructor(options: FixtureRainfallAdapterOptions) {
    if (options.stationId.trim().length === 0) {
      throw new RangeError('Fixture rainfall stationId must not be empty');
    }
    this.context = { ...options.context, capabilities: [...options.context.capabilities] };
    this.capabilities = new Set(options.context.capabilities);
    this.sourceId = options.sourceId;
    this.attributionText = options.attributionText;
    this.attributionUrl = options.attributionUrl ?? null;
    this.stationId = options.stationId;
    this.now = options.now ?? (() => new Date());
  }

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.has(capability);
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult> {
    signal?.throwIfAborted();
    return {
      state: 'HEALTHY',
      latencyMs: 0,
      providerId: this.context.providerId,
      providerKey: this.context.providerKey,
      details: { liveProbe: false, adapter: 'rainfall-fixture' },
    };
  }

  async fetchRainfall(
    request: RainfallAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedRainfallBundle> {
    signal?.throwIfAborted();
    assertCoordinate(request);
    if (!this.supports(request.capability)) {
      throw new RangeError(`Fixture rainfall capability ${request.capability} is disabled`);
    }

    const now = this.now();
    const fetchedAt = now.toISOString();

    if (request.capability === 'rainfall.observed') {
      const validEnd = compactInstant(now);
      const validStart = compactInstant(new Date(now.getTime() - 30 * 60_000));
      const record = RainfallRecordSchema.parse({
        id: `rain:fixture:gauge:${validEnd}`,
        productKind: 'GAUGE_OBSERVATION',
        validStart,
        validEnd,
        accumulationSeconds: 1800,
        amountMm: 1.8,
        unit: 'mm',
        spatial: {
          representation: 'GAUGE',
          latitude: request.latitude,
          longitude: request.longitude,
          resolutionKm: null,
          stationId: this.stationId,
        },
        quality: { state: 'VALID', flags: ['FIXTURE'] },
        source: {
          sourceId: this.sourceId,
          providerConfigId: this.context.providerId,
          productId: 'fixture-gauge-observation',
          productVersion: '1',
          modelRunAt: null,
          observedAt: validEnd,
          fetchedAt,
          attributionText: this.attributionText,
          attributionUrl: this.attributionUrl,
        },
      });
      return { capability: request.capability, records: [record] };
    }

    if (request.capability === 'rainfall.satellite') {
      const validEnd = compactInstant(now);
      const validStart = compactInstant(new Date(now.getTime() - 30 * 60_000));
      const record = RainfallRecordSchema.parse({
        id: `rain:fixture:satellite:${validEnd}:${request.latitude}:${request.longitude}`,
        productKind: 'SATELLITE_ESTIMATE',
        validStart,
        validEnd,
        accumulationSeconds: 1800,
        amountMm: 2.1,
        unit: 'mm',
        spatial: {
          representation: 'GRID_CELL',
          latitude: request.latitude,
          longitude: request.longitude,
          resolutionKm: 10,
          stationId: null,
        },
        quality: { state: 'ESTIMATED', flags: ['FIXTURE', 'SATELLITE'] },
        source: {
          sourceId: this.sourceId,
          providerConfigId: this.context.providerId,
          productId: 'fixture-satellite-estimate',
          productVersion: '1',
          modelRunAt: null,
          observedAt: validEnd,
          fetchedAt,
          attributionText: this.attributionText,
          attributionUrl: this.attributionUrl,
        },
      });
      return { capability: request.capability, records: [record] };
    }

    if (request.capability === 'rainfall.forecast') {
      const hours = request.hours ?? 24;
      if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
        throw new RangeError('Fixture rainfall forecast hours must be between 1 and 168');
      }
      const records = Array.from({ length: hours }, (_, index) => {
        const start = new Date(now.getTime() + index * 3_600_000);
        const end = new Date(start.getTime() + 3_600_000);
        const validStart = compactInstant(start);
        const validEnd = compactInstant(end);
        return RainfallRecordSchema.parse({
          id: `rain:fixture:forecast:${validEnd}:${request.latitude}:${request.longitude}`,
          productKind: 'DETERMINISTIC_FORECAST',
          validStart,
          validEnd,
          accumulationSeconds: 3600,
          amountMm: Number((0.7 + index * 0.3).toFixed(3)),
          unit: 'mm',
          spatial: {
            representation: 'GRID_CELL',
            latitude: request.latitude,
            longitude: request.longitude,
            resolutionKm: 5,
            stationId: null,
          },
          quality: { state: 'ESTIMATED', flags: ['FIXTURE', 'MODEL_FORECAST'] },
          source: {
            sourceId: this.sourceId,
            providerConfigId: this.context.providerId,
            productId: 'fixture-deterministic-forecast',
            productVersion: '1',
            modelRunAt: compactInstant(now),
            observedAt: null,
            fetchedAt,
            attributionText: this.attributionText,
            attributionUrl: this.attributionUrl,
          },
        });
      });
      return { capability: request.capability, records };
    }

    throw new RangeError(`Fixture rainfall capability ${request.capability} is not implemented`);
  }
}
