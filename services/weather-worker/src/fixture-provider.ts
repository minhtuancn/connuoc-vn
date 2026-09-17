import type { ProviderCapability } from '@connuoc/shared-types';

import type {
  ProviderContext,
  ProviderProbeResult,
  WeatherHydrologyProviderAdapter,
} from './contracts.js';
import type {
  NormalizedWeatherBundle,
  WeatherForecastAdapter,
  WeatherForecastRequest,
} from './weather-contracts.js';

const FIXTURE_GRID = {
  spatialRepresentation: 'GRID_CELL' as const,
  latitude: 19.5,
  longitude: 105.5,
  timeZone: 'UTC',
  distanceFromRequestKm: null,
};

const DEFAULT_FIXTURE_NOW = () => new Date('2026-09-17T02:01:00Z');

function compactInstant(value: Date): string {
  const iso = value.toISOString();
  return iso.endsWith('.000Z') ? iso.replace('.000Z', 'Z') : iso;
}

function fixtureSource(now: Date) {
  if (!Number.isFinite(now.getTime())) throw new RangeError('fixture clock must return a valid Date');
  return {
    sourceId: 'synthetic-weather-fixture',
    attributionText: 'Con Nước synthetic fixture',
    attributionUrl: null,
    modelId: 'fixture-model',
    modelRunAt: '2026-09-17T00:00:00Z',
    fetchedAt: compactInstant(now),
  };
}

function instantMetrics(offset = 0) {
  return {
    temperatureC: 29 - offset * 0.5,
    apparentTemperatureC: 31 - offset * 0.5,
    relativeHumidityPct: 80 + offset,
    pressureHpa: 1008 - offset,
    windSpeedMs: 2.2 + offset * 0.2,
    windGustMs: 4.1 + offset * 0.2,
    windDirectionDeg: 110 + offset * 5,
    cloudCoverPct: 65 + offset * 5,
    weatherCode: 3,
    visibilityM: 10_000,
    uvIndex: 2,
    precipitationMm: 0,
    rainMm: 0,
  };
}

function isoHour(hour: number): string {
  return new Date(Date.UTC(2026, 8, 17, hour)).toISOString().replace('.000Z', 'Z');
}

export class FixtureProviderAdapter
  implements WeatherHydrologyProviderAdapter, WeatherForecastAdapter
{
  readonly providerType = 'fixture';
  readonly context: ProviderContext;
  private readonly capabilities: ReadonlySet<ProviderCapability>;

  constructor(
    context: ProviderContext,
    private readonly now: () => Date = DEFAULT_FIXTURE_NOW,
  ) {
    this.context = {
      ...context,
      capabilities: [...context.capabilities],
    };
    this.capabilities = new Set(context.capabilities);
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
      details: { fixture: true },
    };
  }

  async fetchWeather(
    request: WeatherForecastRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedWeatherBundle> {
    signal?.throwIfAborted();

    if (!this.supports(request.capability)) {
      throw new Error(`Fixture provider does not support capability ${request.capability}`);
    }

    const source = fixtureSource(this.now());

    if (request.capability === 'weather.current') {
      return {
        capability: 'weather.current',
        grid: FIXTURE_GRID,
        source,
        data: {
          kind: 'MODEL_CURRENT',
          validAt: '2026-09-17T02:00:00Z',
          ...instantMetrics(),
          temperatureC: 29,
        },
      };
    }

    if (request.capability === 'weather.hourlyForecast') {
      const hours = request.hours ?? 24;
      if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
        throw new RangeError('hours must be an integer between 1 and 168');
      }

      return {
        capability: 'weather.hourlyForecast',
        grid: FIXTURE_GRID,
        source,
        points: Array.from({ length: hours }, (_, index) => ({
          kind: 'FORECAST' as const,
          validAt: isoHour(2 + index),
          ...instantMetrics(index),
          precipitationProbabilityPct: 20 + Math.min(index * 5, 70),
        })),
      };
    }

    const days = request.days ?? 7;
    if (!Number.isInteger(days) || days < 1 || days > 15) {
      throw new RangeError('days must be an integer between 1 and 15');
    }

    return {
      capability: 'weather.dailyForecast',
      grid: FIXTURE_GRID,
      source,
      points: Array.from({ length: days }, (_, index) => ({
        kind: 'FORECAST' as const,
        validDate: new Date(Date.UTC(2026, 8, 17 + index)).toISOString().slice(0, 10),
        temperatureMinC: 24 - index * 0.2,
        temperatureMaxC: 31 - index * 0.2,
        weatherCode: index === 0 ? 3 : 61,
        uvIndexMax: 7,
        precipitationProbabilityMaxPct: 45 + Math.min(index * 10, 40),
        precipitationMm: index === 0 ? 1.2 : 4.8,
        rainMm: index === 0 ? 1.2 : 4.8,
        windSpeedMaxMs: 5.2 + index * 0.2,
        windGustMaxMs: 8.1 + index * 0.2,
      })),
    };
  }
}
