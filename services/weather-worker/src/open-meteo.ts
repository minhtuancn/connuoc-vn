import {
  CurrentWeatherRecordSchema,
  DailyWeatherPointSchema,
  HourlyWeatherPointSchema,
  type ProviderCapability,
  type WeatherGridLocation,
  type WeatherSourceProvenance,
} from '@connuoc/shared-types';

import type { ProviderContext, ProviderProbeResult } from './contracts.js';
import type {
  NormalizedWeatherBundle,
  WeatherForecastAdapter,
  WeatherForecastRequest,
  WeatherHttpClient,
} from './weather-contracts.js';

export type WeatherProviderErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_CAPABILITY'
  | 'INVALID_PAYLOAD'
  | 'HTTP_RETRYABLE'
  | 'HTTP_REJECTED'
  | 'NETWORK';

export class WeatherProviderError extends Error {
  readonly code: WeatherProviderErrorCode;
  readonly retryable: boolean;
  readonly statusCode: number | null;

  constructor(
    code: WeatherProviderErrorCode,
    retryable: boolean,
    statusCode: number | null = null,
  ) {
    super(messageForErrorCode(code));
    this.name = 'WeatherProviderError';
    this.code = code;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

function messageForErrorCode(code: WeatherProviderErrorCode): string {
  switch (code) {
    case 'INVALID_REQUEST':
      return 'Weather request is invalid.';
    case 'UNSUPPORTED_CAPABILITY':
      return 'Weather capability is not supported by this provider.';
    case 'INVALID_PAYLOAD':
      return 'Weather provider returned an invalid payload.';
    case 'HTTP_RETRYABLE':
      return 'Weather provider returned a retryable HTTP response.';
    case 'HTTP_REJECTED':
      return 'Weather provider rejected the request.';
    case 'NETWORK':
      return 'Weather provider network request failed.';
  }
}

export type WeatherFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export class FetchWeatherHttpClient implements WeatherHttpClient {
  private readonly fetchFn: WeatherFetch;

  constructor(fetchFn: WeatherFetch = globalThis.fetch) {
    this.fetchFn = fetchFn;
  }

  async getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
    try {
      const response = await this.fetchFn(url, signal ? { signal } : undefined);
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        throw new WeatherProviderError(
          retryable ? 'HTTP_RETRYABLE' : 'HTTP_REJECTED',
          retryable,
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new WeatherProviderError('INVALID_PAYLOAD', false);
      }
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError('NETWORK', true);
    }
  }
}

export interface OpenMeteoWeatherAdapterOptions {
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

const CURRENT_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'pressure_msl',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'cloud_cover',
  'weather_code',
  'visibility',
  'uv_index',
  'precipitation',
  'rain',
] as const;

const HOURLY_VARIABLES = [
  ...CURRENT_VARIABLES,
  'precipitation_probability',
] as const;

const DAILY_VARIABLES = [
  'temperature_2m_min',
  'temperature_2m_max',
  'weather_code',
  'uv_index_max',
  'precipitation_probability_max',
  'precipitation_sum',
  'rain_sum',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
] as const;

export class OpenMeteoWeatherAdapter implements WeatherForecastAdapter {
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

  constructor(options: OpenMeteoWeatherAdapterOptions) {
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
      details: { liveProbe: false, adapter: 'open-meteo' },
    };
  }

  async fetchWeather(
    request: WeatherForecastRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedWeatherBundle> {
    validateRequest(request);
    if (!this.supports(request.capability)) {
      throw new WeatherProviderError('UNSUPPORTED_CAPABILITY', false);
    }

    const url = this.buildUrl(request);
    const payload = await this.httpClient.getJson(url, signal);

    try {
      const root = asRecord(payload);
      const grid = buildGrid(root, request.latitude, request.longitude);
      const source = this.buildSource();

      switch (request.capability) {
        case 'weather.current':
          return {
            capability: request.capability,
            grid,
            source,
            data: parseCurrent(root),
          };
        case 'weather.hourlyForecast':
          return {
            capability: request.capability,
            grid,
            source,
            points: parseHourly(root),
          };
        case 'weather.dailyForecast':
          return {
            capability: request.capability,
            grid,
            source,
            points: parseDaily(root),
          };
      }
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError('INVALID_PAYLOAD', false);
    }
  }

  private buildUrl(request: WeatherForecastRequest): URL {
    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', String(request.latitude));
    url.searchParams.set('longitude', String(request.longitude));
    url.searchParams.set('timezone', 'UTC');
    url.searchParams.set('timeformat', 'iso8601');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('wind_speed_unit', 'ms');
    url.searchParams.set('precipitation_unit', 'mm');

    if (this.modelId !== 'best_match') {
      url.searchParams.set('models', this.modelId);
    }
    if (this.apiKey !== null) {
      url.searchParams.set('apikey', this.apiKey);
    }

    switch (request.capability) {
      case 'weather.current':
        url.searchParams.set('current', CURRENT_VARIABLES.join(','));
        url.searchParams.set('forecast_days', '1');
        break;
      case 'weather.hourlyForecast':
        url.searchParams.set('hourly', HOURLY_VARIABLES.join(','));
        url.searchParams.set('forecast_hours', String(request.hours));
        break;
      case 'weather.dailyForecast':
        url.searchParams.set('daily', DAILY_VARIABLES.join(','));
        url.searchParams.set('forecast_days', String(request.days));
        break;
    }

    return url;
  }

  private buildSource(): WeatherSourceProvenance {
    return {
      sourceId: this.sourceId,
      attributionText: this.attributionText,
      attributionUrl: this.attributionUrl,
      modelId: this.modelId,
      modelRunAt: null,
      fetchedAt: this.now().toISOString(),
    };
  }
}

function validateRequest(request: WeatherForecastRequest): void {
  if (
    !Number.isFinite(request.latitude) ||
    request.latitude < -90 ||
    request.latitude > 90 ||
    !Number.isFinite(request.longitude) ||
    request.longitude < -180 ||
    request.longitude > 180
  ) {
    throw new WeatherProviderError('INVALID_REQUEST', false);
  }

  if (request.capability === 'weather.hourlyForecast') {
    if (!Number.isInteger(request.hours) || (request.hours ?? 0) < 1 || (request.hours ?? 0) > 168) {
      throw new WeatherProviderError('INVALID_REQUEST', false);
    }
  }
  if (request.capability === 'weather.dailyForecast') {
    if (!Number.isInteger(request.days) || (request.days ?? 0) < 1 || (request.days ?? 0) > 15) {
      throw new WeatherProviderError('INVALID_REQUEST', false);
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value as Record<string, unknown>;
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value;
}

function optionalNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value;
}

function requiredArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value;
}

function numberSeries(
  record: Record<string, unknown>,
  key: string,
  length: number,
  required: boolean,
): Array<number | null> {
  const value = record[key];
  if (value === undefined) {
    if (required) throw new WeatherProviderError('INVALID_PAYLOAD', false);
    return Array.from({ length }, () => null);
  }
  if (!Array.isArray(value) || value.length !== length) {
    throw new WeatherProviderError('INVALID_PAYLOAD', false);
  }
  return value.map((item) => {
    if (item === null && !required) return null;
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      throw new WeatherProviderError('INVALID_PAYLOAD', false);
    }
    return item;
  });
}

function parseCurrent(root: Record<string, unknown>) {
  const current = asRecord(root.current);
  return CurrentWeatherRecordSchema.parse({
    kind: 'MODEL_CURRENT',
    validAt: normalizeUtcInstant(requiredString(current, 'time')),
    temperatureC: requiredNumber(current, 'temperature_2m'),
    apparentTemperatureC: optionalNumber(current, 'apparent_temperature'),
    relativeHumidityPct: requiredNumber(current, 'relative_humidity_2m'),
    pressureHpa: requiredNumber(current, 'pressure_msl'),
    windSpeedMs: requiredNumber(current, 'wind_speed_10m'),
    windGustMs: optionalNumber(current, 'wind_gusts_10m'),
    windDirectionDeg: requiredNumber(current, 'wind_direction_10m'),
    cloudCoverPct: optionalNumber(current, 'cloud_cover'),
    weatherCode: requiredNumber(current, 'weather_code'),
    visibilityM: optionalNumber(current, 'visibility'),
    uvIndex: optionalNumber(current, 'uv_index'),
    precipitationMm: optionalNumber(current, 'precipitation'),
    rainMm: optionalNumber(current, 'rain'),
  });
}

function parseHourly(root: Record<string, unknown>) {
  const hourly = asRecord(root.hourly);
  const times = requiredArray(hourly, 'time');
  const length = times.length;
  if (length < 1 || length > 168) throw new WeatherProviderError('INVALID_PAYLOAD', false);

  const temperature = numberSeries(hourly, 'temperature_2m', length, true);
  const apparent = numberSeries(hourly, 'apparent_temperature', length, false);
  const humidity = numberSeries(hourly, 'relative_humidity_2m', length, true);
  const pressure = numberSeries(hourly, 'pressure_msl', length, true);
  const wind = numberSeries(hourly, 'wind_speed_10m', length, true);
  const gust = numberSeries(hourly, 'wind_gusts_10m', length, false);
  const direction = numberSeries(hourly, 'wind_direction_10m', length, true);
  const cloud = numberSeries(hourly, 'cloud_cover', length, false);
  const code = numberSeries(hourly, 'weather_code', length, true);
  const visibility = numberSeries(hourly, 'visibility', length, false);
  const uv = numberSeries(hourly, 'uv_index', length, false);
  const probability = numberSeries(hourly, 'precipitation_probability', length, false);
  const precipitation = numberSeries(hourly, 'precipitation', length, false);
  const rain = numberSeries(hourly, 'rain', length, false);

  return times.map((time, index) => {
    if (typeof time !== 'string') throw new WeatherProviderError('INVALID_PAYLOAD', false);
    return HourlyWeatherPointSchema.parse({
      kind: 'FORECAST',
      validAt: normalizeUtcInstant(time),
      temperatureC: temperature[index],
      apparentTemperatureC: apparent[index],
      relativeHumidityPct: humidity[index],
      pressureHpa: pressure[index],
      windSpeedMs: wind[index],
      windGustMs: gust[index],
      windDirectionDeg: direction[index],
      cloudCoverPct: cloud[index],
      weatherCode: code[index],
      visibilityM: visibility[index],
      uvIndex: uv[index],
      precipitationProbabilityPct: probability[index],
      precipitationMm: precipitation[index],
      rainMm: rain[index],
    });
  });
}

function parseDaily(root: Record<string, unknown>) {
  const daily = asRecord(root.daily);
  const dates = requiredArray(daily, 'time');
  const length = dates.length;
  if (length < 1 || length > 15) throw new WeatherProviderError('INVALID_PAYLOAD', false);

  const minimum = numberSeries(daily, 'temperature_2m_min', length, true);
  const maximum = numberSeries(daily, 'temperature_2m_max', length, true);
  const code = numberSeries(daily, 'weather_code', length, true);
  const uv = numberSeries(daily, 'uv_index_max', length, false);
  const probability = numberSeries(daily, 'precipitation_probability_max', length, false);
  const precipitation = numberSeries(daily, 'precipitation_sum', length, false);
  const rain = numberSeries(daily, 'rain_sum', length, false);
  const wind = numberSeries(daily, 'wind_speed_10m_max', length, false);
  const gust = numberSeries(daily, 'wind_gusts_10m_max', length, false);

  return dates.map((date, index) => {
    if (typeof date !== 'string') throw new WeatherProviderError('INVALID_PAYLOAD', false);
    return DailyWeatherPointSchema.parse({
      kind: 'FORECAST',
      validDate: date,
      temperatureMinC: minimum[index],
      temperatureMaxC: maximum[index],
      weatherCode: code[index],
      uvIndexMax: uv[index],
      precipitationProbabilityMaxPct: probability[index],
      precipitationMm: precipitation[index],
      rainMm: rain[index],
      windSpeedMaxMs: wind[index],
      windGustMaxMs: gust[index],
    });
  });
}

function buildGrid(
  root: Record<string, unknown>,
  requestedLatitude: number,
  requestedLongitude: number,
): WeatherGridLocation {
  const latitude = requiredNumber(root, 'latitude');
  const longitude = requiredNumber(root, 'longitude');
  return {
    spatialRepresentation: 'GRID_CELL',
    latitude,
    longitude,
    timeZone: 'UTC',
    distanceFromRequestKm: haversineKm(
      requestedLatitude,
      requestedLongitude,
      latitude,
      longitude,
    ),
  };
}

function normalizeUtcInstant(value: string): string {
  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const timestamp = Date.parse(zoned);
  if (!Number.isFinite(timestamp)) throw new WeatherProviderError('INVALID_PAYLOAD', false);
  return new Date(timestamp).toISOString().replace('.000Z', 'Z');
}

function haversineKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
