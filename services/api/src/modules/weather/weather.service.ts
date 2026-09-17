import type {
  Coordinate,
  CurrentWeatherResponse,
  DailyWeatherResponse,
  DeploymentUse,
  HourlyWeatherResponse,
} from '@connuoc/shared-types';

import type {
  WeatherOrchestrationRequest,
  WeatherOrchestrationResult,
} from './weather-orchestrator.js';
import type {
  CachedWeatherBundle,
  PersistableWeatherBundle,
  WeatherForecastCapability,
} from './weather.repository.js';

const CACHE_DISTANCE_KM = 25;
const CURRENT_HOURLY_STALE_GRACE_SECONDS = 21_600;
const DAILY_STALE_GRACE_SECONDS = 43_200;

export class WeatherUnavailableError extends Error {
  readonly code = 'WEATHER_UNAVAILABLE' as const;

  constructor() {
    super('Weather data is temporarily unavailable.');
    this.name = 'WeatherUnavailableError';
  }
}

interface WeatherOrchestratorPort {
  fetch(request: WeatherOrchestrationRequest): Promise<WeatherOrchestrationResult>;
}

interface WeatherCachePort {
  saveBundle(
    providerConfigId: string,
    bundle: PersistableWeatherBundle,
    freshnessSeconds: number,
  ): Promise<string>;
  findNearestCached(
    capability: WeatherForecastCapability,
    coordinate: Coordinate,
    maxDistanceKm: number,
    now: Date,
  ): Promise<CachedWeatherBundle | null>;
}

function compactInstant(date: Date): string {
  const value = date.toISOString();
  return value.endsWith('.000Z') ? value.replace('.000Z', 'Z') : value;
}

function staleAfter(bundle: PersistableWeatherBundle, freshnessSeconds: number): string {
  const fetchedAt = Date.parse(bundle.source.fetchedAt);
  if (!Number.isFinite(fetchedAt)) {
    throw new RangeError('Weather source fetchedAt is invalid.');
  }
  return compactInstant(new Date(fetchedAt + freshnessSeconds * 1000));
}

function isProviderUnavailable(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === 'NO_PROVIDER_AVAILABLE'
  );
}

function staleGraceSeconds(capability: WeatherForecastCapability): number {
  return capability === 'weather.dailyForecast'
    ? DAILY_STALE_GRACE_SECONDS
    : CURRENT_HOURLY_STALE_GRACE_SECONDS;
}

function cacheWithinGrace(
  cached: CachedWeatherBundle,
  capability: WeatherForecastCapability,
  now: Date,
): boolean {
  const staleAt = Date.parse(cached.freshness.staleAfter);
  if (!Number.isFinite(staleAt)) return false;
  return now.getTime() <= staleAt + staleGraceSeconds(capability) * 1000;
}

export class WeatherService {
  constructor(
    private readonly orchestrator: WeatherOrchestratorPort,
    private readonly repository: WeatherCachePort,
    private readonly deploymentUse: DeploymentUse = 'COMMERCIAL',
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getCurrent(coordinate: Coordinate): Promise<CurrentWeatherResponse> {
    const result = await this.fetchOrCache('weather.current', coordinate);
    if (result.bundle.capability !== 'weather.current') {
      throw new WeatherUnavailableError();
    }
    return {
      freshness: result.freshness,
      grid: result.bundle.grid,
      source: result.bundle.source,
      fallbackUsed: result.fallbackUsed,
      data: result.bundle.data,
    };
  }

  async getHourly(coordinate: Coordinate, hours: number): Promise<HourlyWeatherResponse> {
    this.assertHorizon(hours, 168, 'hours');
    const result = await this.fetchOrCache('weather.hourlyForecast', coordinate, { hours });
    if (result.bundle.capability !== 'weather.hourlyForecast') {
      throw new WeatherUnavailableError();
    }
    return {
      freshness: result.freshness,
      grid: result.bundle.grid,
      source: result.bundle.source,
      fallbackUsed: result.fallbackUsed,
      points: [...result.bundle.points],
    };
  }

  async getDaily(coordinate: Coordinate, days: number): Promise<DailyWeatherResponse> {
    this.assertHorizon(days, 15, 'days');
    const result = await this.fetchOrCache('weather.dailyForecast', coordinate, { days });
    if (result.bundle.capability !== 'weather.dailyForecast') {
      throw new WeatherUnavailableError();
    }
    return {
      freshness: result.freshness,
      grid: result.bundle.grid,
      source: result.bundle.source,
      fallbackUsed: result.fallbackUsed,
      points: [...result.bundle.points],
    };
  }

  private async fetchOrCache(
    capability: WeatherForecastCapability,
    coordinate: Coordinate,
    horizon: { hours?: number; days?: number } = {},
  ): Promise<{
    freshness: { state: 'FRESH' | 'STALE'; staleAfter: string };
    fallbackUsed: boolean;
    bundle: PersistableWeatherBundle;
  }> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) throw new RangeError('now must be a valid Date');

    try {
      const live = await this.orchestrator.fetch({
        capability,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        atUtc: now.toISOString(),
        deploymentUse: this.deploymentUse,
        ...(horizon.hours === undefined ? {} : { hours: horizon.hours }),
        ...(horizon.days === undefined ? {} : { days: horizon.days }),
      });
      await this.repository.saveBundle(
        live.providerConfigId,
        live.bundle,
        live.freshnessSeconds,
      );
      return {
        freshness: {
          state: 'FRESH',
          staleAfter: staleAfter(live.bundle, live.freshnessSeconds),
        },
        fallbackUsed: live.fallbackUsed,
        bundle: live.bundle,
      };
    } catch (error) {
      if (!isProviderUnavailable(error)) throw error;
    }

    const cached = await this.repository.findNearestCached(
      capability,
      coordinate,
      CACHE_DISTANCE_KM,
      now,
    );
    if (!cached || !cacheWithinGrace(cached, capability, now)) {
      throw new WeatherUnavailableError();
    }

    return {
      freshness: {
        state: 'STALE',
        staleAfter: cached.freshness.staleAfter,
      },
      fallbackUsed: true,
      bundle: cached.bundle,
    };
  }

  private assertHorizon(value: number, maximum: number, field: string): void {
    if (!Number.isInteger(value) || value < 1 || value > maximum) {
      throw new RangeError(`${field} must be an integer between 1 and ${maximum}`);
    }
  }
}
