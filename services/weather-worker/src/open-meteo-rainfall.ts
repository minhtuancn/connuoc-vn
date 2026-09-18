import { RainfallRecordSchema, type ProviderCapability } from '@connuoc/shared-types';

import type { ProviderContext, ProviderProbeResult } from './contracts.js';
import type {
  NormalizedRainfallBundle,
  RainfallAdapterRequest,
  RainfallProviderAdapter,
} from './rainfall-contracts.js';
import type { WeatherHttpClient } from './weather-contracts.js';

export interface OpenMeteoRainfallAdapterOptions {
  readonly context: ProviderContext;
  readonly httpClient: WeatherHttpClient;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly sourceId: string;
  readonly attributionText: string;
  readonly attributionUrl: string | null;
  readonly modelId?: string;
  readonly now?: () => Date;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Open-Meteo rainfall payload must be an object');
  }
  return value as Record<string, unknown>;
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Open-Meteo rainfall payload is missing numeric ${key}`);
  }
  return value;
}

function requiredArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new TypeError(`Open-Meteo rainfall payload is missing array ${key}`);
  }
  return value;
}

function compactInstant(value: Date): string {
  return value.toISOString().replace('.000Z', 'Z');
}

function utcInstantFromOpenMeteo(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('Open-Meteo rainfall timestamp is invalid');
  }
  const normalized = value.endsWith('Z') ? value : `${value}:00Z`;
  const millis = Date.parse(normalized);
  if (!Number.isFinite(millis)) {
    throw new TypeError('Open-Meteo rainfall timestamp is invalid');
  }
  return compactInstant(new Date(millis));
}

function validateRequest(request: RainfallAdapterRequest): number {
  if (
    request.capability !== 'rainfall.forecast' ||
    !Number.isFinite(request.latitude) ||
    request.latitude < -90 ||
    request.latitude > 90 ||
    !Number.isFinite(request.longitude) ||
    request.longitude < -180 ||
    request.longitude > 180
  ) {
    throw new RangeError('Open-Meteo rainfall request is invalid');
  }
  const hours = request.hours ?? 24;
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
    throw new RangeError('Open-Meteo rainfall forecast hours must be between 1 and 168');
  }
  return hours;
}

export class OpenMeteoRainfallAdapter implements RainfallProviderAdapter {
  readonly providerType = 'open-meteo';
  readonly context: ProviderContext;

  private readonly capabilities: ReadonlySet<ProviderCapability>;
  private readonly httpClient: WeatherHttpClient;
  private readonly baseUrl: URL;
  private readonly apiKey: string | null;
  private readonly sourceId: string;
  private readonly attributionText: string;
  private readonly attributionUrl: string | null;
  private readonly modelId: string;
  private readonly now: () => Date;

  constructor(options: OpenMeteoRainfallAdapterOptions) {
    this.context = { ...options.context, capabilities: [...options.context.capabilities] };
    this.capabilities = new Set(options.context.capabilities);
    this.httpClient = options.httpClient;
    this.baseUrl = new URL(options.baseUrl);
    this.apiKey = options.apiKey ?? null;
    this.sourceId = options.sourceId;
    this.attributionText = options.attributionText;
    this.attributionUrl = options.attributionUrl;
    this.modelId = options.modelId ?? 'best_match';
    this.now = options.now ?? (() => new Date());
  }

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.has(capability);
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult> {
    signal?.throwIfAborted();
    return {
      state: 'UNKNOWN',
      latencyMs: 0,
      providerId: this.context.providerId,
      providerKey: this.context.providerKey,
      details: { liveProbe: false, adapter: 'open-meteo-rainfall' },
    };
  }

  async fetchRainfall(
    request: RainfallAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedRainfallBundle> {
    const hours = validateRequest(request);
    if (!this.supports('rainfall.forecast')) {
      throw new RangeError('Open-Meteo rainfall forecast capability is disabled');
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', String(request.latitude));
    url.searchParams.set('longitude', String(request.longitude));
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('timeformat', 'iso8601');
    url.searchParams.set('precipitation_unit', 'mm');
    url.searchParams.set('hourly', 'precipitation,rain');
    url.searchParams.set('forecast_hours', String(hours));
    if (this.modelId !== 'best_match') url.searchParams.set('models', this.modelId);
    if (this.apiKey !== null) url.searchParams.set('apikey', this.apiKey);

    const root = asRecord(await this.httpClient.getJson(url, signal));
    const latitude = requiredNumber(root, 'latitude');
    const longitude = requiredNumber(root, 'longitude');
    const hourly = asRecord(root.hourly);
    const times = requiredArray(hourly, 'time');
    const precipitation = requiredArray(hourly, 'precipitation');
    const rain = requiredArray(hourly, 'rain');
    if (times.length !== precipitation.length || times.length !== rain.length) {
      throw new TypeError('Open-Meteo rainfall hourly series lengths do not match');
    }

    const fetchedAt = compactInstant(this.now());
    const records = times.map((time, index) => {
      const validEnd = utcInstantFromOpenMeteo(time);
      const endMs = Date.parse(validEnd);
      const validStart = compactInstant(new Date(endMs - 3_600_000));
      const amountMm = precipitation[index];
      const rainMm = rain[index];
      if (typeof amountMm !== 'number' || !Number.isFinite(amountMm) || amountMm < 0) {
        throw new TypeError('Open-Meteo precipitation total must be a non-negative number');
      }
      if (typeof rainMm !== 'number' || !Number.isFinite(rainMm) || rainMm < 0) {
        throw new TypeError('Open-Meteo rain total must be a non-negative number');
      }

      return RainfallRecordSchema.parse({
        id: `rain:open-meteo:${this.modelId}:${validEnd}:${latitude}:${longitude}`,
        productKind: 'DETERMINISTIC_FORECAST',
        validStart,
        validEnd,
        accumulationSeconds: 3600,
        amountMm,
        unit: 'mm',
        spatial: {
          representation: 'GRID_CELL',
          latitude,
          longitude,
          resolutionKm: null,
          stationId: null,
        },
        quality: {
          state: 'ESTIMATED',
          flags: rainMm < amountMm ? ['MODEL_FORECAST', 'PRECIPITATION_TOTAL_INCLUDES_NON_RAIN'] : ['MODEL_FORECAST'],
        },
        source: {
          sourceId: this.sourceId,
          providerConfigId: this.context.providerId,
          productId: 'open-meteo-hourly-precipitation',
          productVersion: this.modelId,
          modelRunAt: null,
          observedAt: null,
          fetchedAt,
          attributionText: this.attributionText,
          attributionUrl: this.attributionUrl,
        },
      });
    });

    return { capability: 'rainfall.forecast', records };
  }
}
