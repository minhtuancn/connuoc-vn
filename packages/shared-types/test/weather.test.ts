import { describe, expect, it } from 'vitest';

import * as contracts from '../src/index.ts';

const exported = contracts as unknown as Record<
  string,
  { parse: (value: unknown) => unknown; safeParse: (value: unknown) => { success: boolean } }
>;

const source = {
  sourceId: 'open-meteo-paid-hosted',
  attributionText: 'Open-Meteo',
  attributionUrl: 'https://open-meteo.com/',
  modelId: 'best_match',
  modelRunAt: null,
  fetchedAt: '2026-09-17T01:01:00Z',
};

const grid = {
  spatialRepresentation: 'GRID_CELL',
  latitude: 19.5,
  longitude: 105.5,
  timeZone: 'Asia/Ho_Chi_Minh',
  distanceFromRequestKm: 1.2,
};

describe('weather contracts', () => {
  it('exports the normalized Phase 5B weather contract schemas', () => {
    expect('WeatherFreshnessStateSchema' in contracts).toBe(true);
    expect('WeatherFreshnessSchema' in contracts).toBe(true);
    expect('WeatherSourceProvenanceSchema' in contracts).toBe(true);
    expect('WeatherGridLocationSchema' in contracts).toBe(true);
    expect('CurrentWeatherRecordSchema' in contracts).toBe(true);
    expect('HourlyWeatherPointSchema' in contracts).toBe(true);
    expect('DailyWeatherPointSchema' in contracts).toBe(true);
    expect('CurrentWeatherResponseSchema' in contracts).toBe(true);
    expect('HourlyWeatherResponseSchema' in contracts).toBe(true);
    expect('DailyWeatherResponseSchema' in contracts).toBe(true);
  });

  it('distinguishes model-current from forecast and allows undisclosed model run time', () => {
    const current = exported.CurrentWeatherRecordSchema.parse({
      kind: 'MODEL_CURRENT',
      validAt: '2026-09-17T01:00:00Z',
      temperatureC: 29.2,
      apparentTemperatureC: 33.1,
      relativeHumidityPct: 82,
      pressureHpa: 1007.4,
      windSpeedMs: 2.3,
      windGustMs: null,
      windDirectionDeg: 110,
      cloudCoverPct: 75,
      weatherCode: 61,
      visibilityM: null,
      uvIndex: 7.1,
      precipitationMm: 1.4,
      rainMm: 1.4,
    }) as { kind: string };
    const provenance = exported.WeatherSourceProvenanceSchema.parse(source) as {
      modelRunAt: string | null;
    };

    expect(current.kind).toBe('MODEL_CURRENT');
    expect(provenance.modelRunAt).toBeNull();
  });

  it('rejects impossible percentage and direction ranges without fabricating optional metrics', () => {
    const valid = {
      kind: 'FORECAST',
      validAt: '2026-09-17T02:00:00Z',
      temperatureC: 29,
      apparentTemperatureC: null,
      relativeHumidityPct: 80,
      pressureHpa: 1008,
      windSpeedMs: 3,
      windGustMs: null,
      windDirectionDeg: 180,
      cloudCoverPct: null,
      weatherCode: 3,
      visibilityM: null,
      uvIndex: null,
      precipitationProbabilityPct: null,
      precipitationMm: 0,
      rainMm: null,
    };

    expect(exported.HourlyWeatherPointSchema.safeParse(valid).success).toBe(true);
    expect(
      exported.HourlyWeatherPointSchema.safeParse({ ...valid, relativeHumidityPct: 101 }).success,
    ).toBe(false);
    expect(
      exported.HourlyWeatherPointSchema.safeParse({ ...valid, precipitationProbabilityPct: -1 })
        .success,
    ).toBe(false);
    expect(
      exported.HourlyWeatherPointSchema.safeParse({ ...valid, windDirectionDeg: 361 }).success,
    ).toBe(false);
  });

  it('bounds hourly and daily response horizons and keeps public metadata vendor-neutral', () => {
    const hourlyPoint = {
      kind: 'FORECAST',
      validAt: '2026-09-17T02:00:00Z',
      temperatureC: 29,
      apparentTemperatureC: null,
      relativeHumidityPct: 80,
      pressureHpa: 1008,
      windSpeedMs: 3,
      windGustMs: null,
      windDirectionDeg: 180,
      cloudCoverPct: 70,
      weatherCode: 3,
      visibilityM: 10000,
      uvIndex: 4.8,
      precipitationProbabilityPct: 20,
      precipitationMm: 0,
      rainMm: 0,
    };
    const dailyPoint = {
      kind: 'FORECAST',
      validDate: '2026-09-17',
      temperatureMinC: 25,
      temperatureMaxC: 32,
      weatherCode: 61,
      uvIndexMax: 9.2,
      precipitationProbabilityMaxPct: 70,
      precipitationMm: 12,
      rainMm: 12,
      windSpeedMaxMs: 8,
      windGustMaxMs: null,
    };
    const base = {
      freshness: { state: 'FRESH', staleAfter: '2026-09-17T02:01:00Z' },
      grid,
      source,
      fallbackUsed: false,
    };

    expect(
      exported.HourlyWeatherResponseSchema.safeParse({ ...base, points: [hourlyPoint] }).success,
    ).toBe(true);
    expect(
      exported.HourlyWeatherResponseSchema.safeParse({
        ...base,
        points: Array.from({ length: 169 }, () => hourlyPoint),
      }).success,
    ).toBe(false);
    expect(
      exported.DailyWeatherResponseSchema.safeParse({ ...base, points: [dailyPoint] }).success,
    ).toBe(true);
    expect(
      exported.DailyWeatherResponseSchema.safeParse({
        ...base,
        points: Array.from({ length: 16 }, () => dailyPoint),
      }).success,
    ).toBe(false);

    const parsed = exported.HourlyWeatherResponseSchema.parse({
      ...base,
      points: [hourlyPoint],
    }) as Record<string, unknown>;
    expect(JSON.stringify(parsed)).not.toContain('providerKey');
    expect(JSON.stringify(parsed)).not.toContain('secretRef');
  });
});
