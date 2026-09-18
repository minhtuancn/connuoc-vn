import {
  HydrologyDischargeRecordSchema,
  RiverReachResolutionSchema,
  type HydrologyDischargeStatistic,
  type ProviderCapability,
} from '@connuoc/shared-types';

import type { ProviderContext, ProviderProbeResult } from './contracts.js';
import type {
  HydrologyAdapterRequest,
  HydrologyProviderAdapter,
  HydrologyReachLookupRequest,
  HydrologyReturnPeriodRequest,
  NormalizedHydrologyBundle,
  NormalizedHydrologyReturnPeriodBundle,
} from './hydrology-contracts.js';
import type { WeatherHttpClient } from './weather-contracts.js';

export interface OpenMeteoFloodHydrologyAdapterOptions {
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

const GRID_MAPPING_CONFIDENCE = 0.35;

const FLOOD_STATISTICS: ReadonlyArray<{
  readonly variable: string;
  readonly statistic: HydrologyDischargeStatistic;
}> = [
  { variable: 'river_discharge_mean', statistic: 'MEAN' },
  { variable: 'river_discharge_median', statistic: 'MEDIAN' },
  { variable: 'river_discharge_max', statistic: 'MAX' },
  { variable: 'river_discharge_min', statistic: 'MIN' },
  { variable: 'river_discharge_p25', statistic: 'P25' },
  { variable: 'river_discharge_p75', statistic: 'P75' },
];

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(message);
  }
  return value as Record<string, unknown>;
}

function requiredNumber(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Open-Meteo Flood payload is missing numeric ${key}`);
  }
  return value;
}

function requiredArray(
  record: Record<string, unknown>,
  key: string,
): readonly unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new TypeError(`Open-Meteo Flood payload is missing array ${key}`);
  }
  return value;
}

function requiredNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(
      `Open-Meteo Flood ${field} must be a non-negative number`,
    );
  }
  return value;
}

function compactInstant(value: Date): string {
  const instant = value.toISOString();
  return instant.endsWith('.000Z') ? instant.replace('.000Z', 'Z') : instant;
}

function normalizeInstant(value: string, field: string): string {
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) {
    throw new RangeError(`${field} must be a valid ISO instant`);
  }
  return compactInstant(new Date(millis));
}

function dailyInstant(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError('Open-Meteo Flood daily time must be YYYY-MM-DD');
  }
  return normalizeInstant(`${value}T00:00:00Z`, 'daily time');
}

function assertCoordinate(latitude: number, longitude: number): void {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError('Open-Meteo Flood coordinate is invalid');
  }
}

function assertReachId(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new RangeError(`${field} must not be empty`);
  }
  return normalized;
}

function forecastDays(value: number | undefined): number {
  const days = value ?? 30;
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new RangeError(
      'Open-Meteo Flood forecast days must be between 1 and 30',
    );
  }
  return days;
}

function gridCellId(latitude: number, longitude: number): string {
  return `glofas-grid:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusKm = 6371.0088;
  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);
  const deltaLat = toRadians(latitude2 - latitude1);
  const deltaLon = toRadians(longitude2 - longitude1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function assertUnit(
  units: Record<string, unknown>,
  variable: string,
): void {
  const value = units[variable];
  if (value === undefined) return;
  if (typeof value !== 'string') {
    throw new TypeError(
      `Open-Meteo Flood unit for ${variable} must be a string`,
    );
  }
  const normalized = value
    .toLowerCase()
    .replaceAll('³', '3')
    .replaceAll(' ', '');
  if (normalized !== 'm3/s' && normalized !== 'cms') {
    throw new TypeError(
      `Open-Meteo Flood ${variable} unit must be cubic metres per second`,
    );
  }
}

export class OpenMeteoFloodHydrologyAdapter
  implements HydrologyProviderAdapter
{
  readonly providerType = 'open-meteo-flood';
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

  constructor(options: OpenMeteoFloodHydrologyAdapterOptions) {
    this.context = {
      ...options.context,
      capabilities: [...options.context.capabilities],
    };
    this.capabilities = new Set(options.context.capabilities);
    this.httpClient = options.httpClient;
    this.baseUrl = new URL(options.baseUrl);
    this.apiKey = options.apiKey ?? null;
    this.sourceId = options.sourceId;
    this.attributionText = options.attributionText;
    this.attributionUrl = options.attributionUrl;
    this.modelId = options.modelId ?? 'forecast_v4';
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
      details: { liveProbe: false, adapter: 'open-meteo-flood' },
    };
  }

  async resolveReach(
    request: HydrologyReachLookupRequest,
    signal?: AbortSignal,
  ) {
    signal?.throwIfAborted();
    assertCoordinate(request.latitude, request.longitude);

    const root = await this.requestFlood(
      request.latitude,
      request.longitude,
      1,
      false,
      ['river_discharge'],
      signal,
    );
    const grid = this.grid(root, request.latitude, request.longitude);
    const providerReachId = gridCellId(grid.latitude, grid.longitude);

    return RiverReachResolutionSchema.parse({
      state: 'MAPPED',
      providerKey: this.context.providerKey,
      selectedProviderReachId: providerReachId,
      candidates: [
        {
          providerReachId,
          distanceKm: grid.distanceKm,
          confidence: GRID_MAPPING_CONFIDENCE,
        },
      ],
    });
  }

  async fetchHydrology(
    request: HydrologyAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    signal?.throwIfAborted();
    if (!this.supports(request.capability)) {
      throw new RangeError(
        `Open-Meteo Flood capability ${request.capability} is disabled`,
      );
    }
    if (
      request.capability !== 'hydrology.dischargeForecast' &&
      request.capability !== 'hydrology.dischargeEnsemble'
    ) {
      throw new RangeError(
        `Open-Meteo Flood capability ${request.capability} is not implemented`,
      );
    }

    const riverReachId = assertReachId(request.riverReachId, 'riverReachId');
    const providerReachId = assertReachId(
      request.providerReachId,
      'providerReachId',
    );
    if (
      request.latitude === undefined ||
      request.longitude === undefined
    ) {
      throw new RangeError(
        'Open-Meteo Flood forecast requires latitude and longitude',
      );
    }
    assertCoordinate(request.latitude, request.longitude);
    if (request.modelRunAtUtc === undefined) {
      throw new RangeError(
        'Open-Meteo Flood forecast requires modelRunAtUtc',
      );
    }
    const modelRunAt = normalizeInstant(
      request.modelRunAtUtc,
      'modelRunAtUtc',
    );
    const days = forecastDays(request.days);
    const ensemble = request.capability === 'hydrology.dischargeEnsemble';
    const variables = ensemble
      ? [
          'river_discharge_mean',
          'river_discharge_median',
          'river_discharge_max',
          'river_discharge_min',
          'river_discharge_p25',
          'river_discharge_p75',
          'river_discharge',
        ]
      : ['river_discharge_mean'];

    const root = await this.requestFlood(
      request.latitude,
      request.longitude,
      days,
      ensemble,
      variables,
      signal,
    );
    const grid = this.grid(root, request.latitude, request.longitude);
    const actualProviderReachId = gridCellId(grid.latitude, grid.longitude);
    if (actualProviderReachId !== providerReachId) {
      throw new TypeError(
        `Open-Meteo Flood provider grid drift: expected ${providerReachId}, received ${actualProviderReachId}`,
      );
    }

    const daily = asRecord(
      root.daily,
      'Open-Meteo Flood payload is missing daily data',
    );
    const units = asRecord(
      root.daily_units,
      'Open-Meteo Flood payload is missing daily_units',
    );
    const times = requiredArray(daily, 'time');
    const mapping = {
      state: 'MAPPED' as const,
      method: 'MODEL_GRID_CELL' as const,
      confidence: GRID_MAPPING_CONFIDENCE,
      distanceKm: grid.distanceKm,
    };

    if (!ensemble) {
      const values = requiredArray(daily, 'river_discharge_mean');
      this.assertSeries(times, values, 'river_discharge_mean');
      assertUnit(units, 'river_discharge_mean');

      const records = times.map((time, index) => {
        const validAt = dailyInstant(time);
        return HydrologyDischargeRecordSchema.parse({
          id: `hydro:open-meteo:${providerReachId}:${validAt}:mean`,
          productKind: 'FORECAST_MEAN',
          riverReachId,
          providerReachId,
          mapping,
          validAt,
          modelRunAt,
          leadSeconds: this.leadSeconds(modelRunAt, validAt),
          dischargeCms: requiredNonNegativeNumber(
            values[index],
            'river_discharge_mean',
          ),
          unit: 'm3/s',
          ensembleMember: null,
          statistic: 'MEAN',
          quality: {
            state: 'ESTIMATED',
            flags: ['MODEL_FORECAST', 'GLOFAS_GRID_CELL'],
          },
          source: this.source('open-meteo-flood-glofas-forecast'),
        });
      });

      return {
        capability: 'hydrology.dischargeForecast',
        records,
      };
    }

    const records = [];

    for (const descriptor of FLOOD_STATISTICS) {
      if (!(descriptor.variable in daily)) continue;
      const values = requiredArray(daily, descriptor.variable);
      this.assertSeries(times, values, descriptor.variable);
      assertUnit(units, descriptor.variable);

      for (const [index, time] of times.entries()) {
        const validAt = dailyInstant(time);
        records.push(
          HydrologyDischargeRecordSchema.parse({
            id: `hydro:open-meteo:${providerReachId}:${validAt}:stat:${descriptor.statistic.toLowerCase()}`,
            productKind: 'FORECAST_STATISTIC',
            riverReachId,
            providerReachId,
            mapping,
            validAt,
            modelRunAt,
            leadSeconds: this.leadSeconds(modelRunAt, validAt),
            dischargeCms: requiredNonNegativeNumber(
              values[index],
              descriptor.variable,
            ),
            unit: 'm3/s',
            ensembleMember: null,
            statistic: descriptor.statistic,
            quality: {
              state: 'ESTIMATED',
              flags: [
                'MODEL_FORECAST',
                'ENSEMBLE_STATISTIC',
                'GLOFAS_GRID_CELL',
              ],
            },
            source: this.source('open-meteo-flood-glofas-ensemble'),
          }),
        );
      }
    }

    for (const [variable, rawValues] of Object.entries(daily)) {
      const match = /^river_discharge_member(\d+)$/.exec(variable);
      if (!match) continue;
      if (!Array.isArray(rawValues)) {
        throw new TypeError(
          `Open-Meteo Flood ${variable} must be an array`,
        );
      }
      this.assertSeries(times, rawValues, variable);
      assertUnit(units, variable);
      const member = Number(match[1]);
      if (!Number.isInteger(member) || member < 1 || member > 100) {
        throw new TypeError(
          `Open-Meteo Flood ensemble member ${match[1]} is invalid`,
        );
      }

      for (const [index, time] of times.entries()) {
        const validAt = dailyInstant(time);
        records.push(
          HydrologyDischargeRecordSchema.parse({
            id: `hydro:open-meteo:${providerReachId}:${validAt}:member-${member}`,
            productKind: 'FORECAST_ENSEMBLE_MEMBER',
            riverReachId,
            providerReachId,
            mapping,
            validAt,
            modelRunAt,
            leadSeconds: this.leadSeconds(modelRunAt, validAt),
            dischargeCms: requiredNonNegativeNumber(
              rawValues[index],
              variable,
            ),
            unit: 'm3/s',
            ensembleMember: member,
            statistic: null,
            quality: {
              state: 'ESTIMATED',
              flags: [
                'MODEL_FORECAST',
                'ENSEMBLE_MEMBER',
                'GLOFAS_GRID_CELL',
              ],
            },
            source: this.source('open-meteo-flood-glofas-ensemble'),
          }),
        );
      }
    }

    if (records.length === 0) {
      throw new TypeError(
        'Open-Meteo Flood ensemble payload contains no usable records',
      );
    }

    return {
      capability: 'hydrology.dischargeEnsemble',
      records,
    };
  }

  async fetchReturnPeriods(
    _request: HydrologyReturnPeriodRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyReturnPeriodBundle> {
    signal?.throwIfAborted();
    throw new RangeError(
      'Open-Meteo Flood adapter does not provide return-period thresholds',
    );
  }

  private async requestFlood(
    latitude: number,
    longitude: number,
    days: number,
    ensemble: boolean,
    variables: readonly string[],
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('daily', variables.join(','));
    url.searchParams.set('forecast_days', String(days));
    url.searchParams.set('timeformat', 'iso8601');
    url.searchParams.set('timezone', 'GMT');
    url.searchParams.set('models', this.modelId);
    url.searchParams.set('cell_selection', 'nearest');
    if (ensemble) url.searchParams.set('ensemble', 'true');
    if (this.apiKey !== null) url.searchParams.set('apikey', this.apiKey);

    return asRecord(
      await this.httpClient.getJson(url, signal),
      'Open-Meteo Flood payload must be an object',
    );
  }

  private grid(
    root: Record<string, unknown>,
    requestLatitude: number,
    requestLongitude: number,
  ) {
    const latitude = requiredNumber(root, 'latitude');
    const longitude = requiredNumber(root, 'longitude');
    assertCoordinate(latitude, longitude);
    return {
      latitude,
      longitude,
      distanceKm: haversineKm(
        requestLatitude,
        requestLongitude,
        latitude,
        longitude,
      ),
    };
  }

  private assertSeries(
    times: readonly unknown[],
    values: readonly unknown[],
    field: string,
  ): void {
    if (times.length !== values.length) {
      throw new TypeError(
        `Open-Meteo Flood ${field} length does not match daily time length`,
      );
    }
  }

  private leadSeconds(modelRunAt: string, validAt: string): number {
    const seconds =
      (Date.parse(validAt) - Date.parse(modelRunAt)) / 1000;
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new TypeError(
        'Open-Meteo Flood valid time precedes the supplied model run',
      );
    }
    return seconds;
  }

  private source(productId: string) {
    return {
      sourceId: this.sourceId,
      providerConfigId: this.context.providerId,
      productId,
      productVersion: this.modelId,
      fetchedAt: compactInstant(this.now()),
      attributionText: this.attributionText,
      attributionUrl: this.attributionUrl,
    };
  }
}
