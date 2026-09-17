import { describe, expect, it, vi } from 'vitest';

import {
  WeatherUnavailableError,
  WeatherService,
} from '../src/modules/weather/weather.service.js';

const coordinate = { latitude: 19.51, longitude: 105.51 } as const;

const bundle = {
  capability: 'weather.current' as const,
  grid: {
    spatialRepresentation: 'GRID_CELL' as const,
    latitude: 19.5,
    longitude: 105.5,
    timeZone: 'UTC',
    distanceFromRequestKm: null,
  },
  source: {
    sourceId: 'synthetic-weather-fixture',
    attributionText: 'Con Nước synthetic fixture',
    attributionUrl: null,
    modelId: 'fixture-model',
    modelRunAt: '2026-09-17T00:00:00Z',
    fetchedAt: '2026-09-17T04:00:00Z',
  },
  data: {
    kind: 'MODEL_CURRENT' as const,
    validAt: '2026-09-17T04:00:00Z',
    temperatureC: 29,
    apparentTemperatureC: 31,
    relativeHumidityPct: 80,
    pressureHpa: 1008,
    windSpeedMs: 2.2,
    windGustMs: 4.1,
    windDirectionDeg: 110,
    cloudCoverPct: 65,
    weatherCode: 3,
    visibilityM: 10_000,
    uvIndex: 2,
    precipitationMm: 0,
    rainMm: 0,
  },
};

function unavailableProviderError() {
  return Object.assign(new Error('bounded'), { code: 'NO_PROVIDER_AVAILABLE' });
}

describe('WeatherService freshness policy', () => {
  it('persists a live provider-grid bundle and returns FRESH metadata', async () => {
    const orchestrator = {
      fetch: vi.fn(async () => ({
        providerConfigId: 'provider-1',
        freshnessSeconds: 900,
        fallbackUsed: false,
        bundle,
      })),
    };
    const repository = {
      saveBundle: vi.fn(async () => 'run-1'),
      findNearestCached: vi.fn(),
    };
    const service = new WeatherService(
      orchestrator,
      repository,
      'COMMERCIAL',
      () => new Date('2026-09-17T04:01:00Z'),
    );

    await expect(service.getCurrent(coordinate)).resolves.toEqual({
      freshness: { state: 'FRESH', staleAfter: '2026-09-17T04:15:00Z' },
      grid: bundle.grid,
      source: bundle.source,
      fallbackUsed: false,
      data: bundle.data,
    });
    expect(repository.saveBundle).toHaveBeenCalledWith('provider-1', bundle, 900);
    expect(repository.findNearestCached).not.toHaveBeenCalled();
  });

  it('returns the nearest cached bundle as STALE after all live providers fail', async () => {
    const cachedGrid = { ...bundle.grid, distanceFromRequestKm: 1.4 };
    const cachedBundle = {
      ...bundle,
      grid: cachedGrid,
      source: {
        ...bundle.source,
        fetchedAt: '2026-09-17T00:00:00Z',
        modelRunAt: '2026-09-16T18:00:00Z',
      },
      data: { ...bundle.data, validAt: '2026-09-17T00:00:00Z', temperatureC: 27 },
    };
    const orchestrator = { fetch: vi.fn(async () => { throw unavailableProviderError(); }) };
    const repository = {
      saveBundle: vi.fn(),
      findNearestCached: vi.fn(async () => ({
        runId: 'cached-run',
        freshness: { state: 'STALE' as const, staleAfter: '2026-09-17T00:15:00Z' },
        bundle: cachedBundle,
      })),
    };
    const service = new WeatherService(
      orchestrator,
      repository,
      'COMMERCIAL',
      () => new Date('2026-09-17T05:00:00Z'),
    );

    const result = await service.getCurrent(coordinate);
    expect(result.freshness).toEqual({ state: 'STALE', staleAfter: '2026-09-17T00:15:00Z' });
    expect(result.fallbackUsed).toBe(true);
    expect(result.grid).toEqual(cachedGrid);
    expect(result.source.fetchedAt).toBe('2026-09-17T00:00:00Z');
    expect(result.source.modelRunAt).toBe('2026-09-16T18:00:00Z');
    expect(result.data.validAt).toBe('2026-09-17T00:00:00Z');
    expect(repository.findNearestCached).toHaveBeenCalledWith(
      'weather.current',
      coordinate,
      25,
      new Date('2026-09-17T05:00:00Z'),
    );
  });

  it('returns WEATHER_UNAVAILABLE when current/hourly cache exceeds the six-hour stale grace', async () => {
    const orchestrator = { fetch: vi.fn(async () => { throw unavailableProviderError(); }) };
    const repository = {
      saveBundle: vi.fn(),
      findNearestCached: vi.fn(async () => ({
        runId: 'old-run',
        freshness: { state: 'STALE' as const, staleAfter: '2026-09-16T21:59:59Z' },
        bundle,
      })),
    };
    const service = new WeatherService(
      orchestrator,
      repository,
      'COMMERCIAL',
      () => new Date('2026-09-17T04:00:00Z'),
    );

    await expect(service.getCurrent(coordinate)).rejects.toMatchObject({
      code: 'WEATHER_UNAVAILABLE',
      message: 'Weather data is temporarily unavailable.',
    });
  });

  it('returns WEATHER_UNAVAILABLE when no cache exists within 25 km', async () => {
    const orchestrator = { fetch: vi.fn(async () => { throw unavailableProviderError(); }) };
    const repository = {
      saveBundle: vi.fn(),
      findNearestCached: vi.fn(async () => null),
    };
    const service = new WeatherService(
      orchestrator,
      repository,
      'COMMERCIAL',
      () => new Date('2026-09-17T04:00:00Z'),
    );

    await expect(service.getHourly(coordinate, 48)).rejects.toBeInstanceOf(WeatherUnavailableError);
  });

  it('allows daily cache for the twelve-hour stale grace but preserves original forecast metadata', async () => {
    const dailyBundle = {
      capability: 'weather.dailyForecast' as const,
      grid: bundle.grid,
      source: { ...bundle.source, fetchedAt: '2026-09-16T12:00:00Z' },
      points: [
        {
          kind: 'FORECAST' as const,
          validDate: '2026-09-17',
          temperatureMinC: 24,
          temperatureMaxC: 31,
          weatherCode: 61,
          uvIndexMax: 7,
          precipitationProbabilityMaxPct: 70,
          precipitationMm: 5,
          rainMm: 5,
          windSpeedMaxMs: 5,
          windGustMaxMs: 8,
        },
      ],
    };
    const orchestrator = { fetch: vi.fn(async () => { throw unavailableProviderError(); }) };
    const repository = {
      saveBundle: vi.fn(),
      findNearestCached: vi.fn(async () => ({
        runId: 'daily-cache',
        freshness: { state: 'STALE' as const, staleAfter: '2026-09-16T12:15:00Z' },
        bundle: dailyBundle,
      })),
    };
    const service = new WeatherService(
      orchestrator,
      repository,
      'COMMERCIAL',
      () => new Date('2026-09-16T23:59:59Z'),
    );

    const response = await service.getDaily(coordinate, 7);
    expect(response.freshness.state).toBe('STALE');
    expect(response.source.fetchedAt).toBe('2026-09-16T12:00:00Z');
    expect(response.points[0]?.validDate).toBe('2026-09-17');
  });
});
