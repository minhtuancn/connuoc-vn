import { describe, expect, it } from 'vitest';

import { FixtureProviderAdapter } from '../src/fixture-provider.js';

const capabilities = ['weather.current', 'rainfall.forecast'] as const;

describe('weather/hydrology provider adapter foundation', () => {
  it('uses exact capability matching without aliases or prefix guessing', () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      capabilities,
      secretRef: 'secret://weather/fixture-primary',
    });

    expect(adapter.supports('weather.current')).toBe(true);
    expect(adapter.supports('rainfall.forecast')).toBe(true);
    expect(adapter.supports('weather.hourlyForecast')).toBe(false);
  });

  it('returns a deterministic redacted health probe', async () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      capabilities,
      secretRef: 'secret://weather/fixture-primary',
    });

    await expect(adapter.healthCheck()).resolves.toEqual({
      state: 'HEALTHY',
      latencyMs: 0,
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      details: { fixture: true },
    });

    expect(JSON.stringify(await adapter.healthCheck())).not.toContain('secret://');
  });

  it('keeps secretRef as opaque context and never exposes it from probe results', async () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-secret',
      providerKey: 'fixture-secret-provider',
      capabilities: ['weather.current'],
      secretRef: 'vault://providers/weather/key-7',
    });

    const probe = await adapter.healthCheck();
    expect('secretRef' in probe).toBe(false);
    expect(JSON.stringify(probe)).not.toContain('vault://providers/weather/key-7');
  });

  it('returns deterministic normalized current/hourly/daily fixture weather without secrets', async () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-weather-1',
      providerKey: 'fixture-weather-primary',
      capabilities: [
        'weather.current',
        'weather.hourlyForecast',
        'weather.dailyForecast',
      ],
      secretRef: 'secret://fixture/weather',
    });

    const current = await adapter.fetchWeather({
      capability: 'weather.current',
      latitude: 19.51,
      longitude: 105.51,
    });
    const hourly = await adapter.fetchWeather({
      capability: 'weather.hourlyForecast',
      latitude: 19.51,
      longitude: 105.51,
      hours: 2,
    });
    const daily = await adapter.fetchWeather({
      capability: 'weather.dailyForecast',
      latitude: 19.51,
      longitude: 105.51,
      days: 2,
    });

    expect(current.capability).toBe('weather.current');
    if (current.capability !== 'weather.current') throw new Error('unexpected capability');
    expect(current.data).toMatchObject({
      kind: 'MODEL_CURRENT',
      validAt: '2026-09-17T02:00:00Z',
      temperatureC: 29,
      weatherCode: 3,
    });
    expect(current.grid).toEqual({
      spatialRepresentation: 'GRID_CELL',
      latitude: 19.5,
      longitude: 105.5,
      timeZone: 'UTC',
      distanceFromRequestKm: null,
    });
    expect(current.source).toEqual({
      sourceId: 'synthetic-weather-fixture',
      attributionText: 'Con Nước synthetic fixture',
      attributionUrl: null,
      modelId: 'fixture-model',
      modelRunAt: '2026-09-17T00:00:00Z',
      fetchedAt: '2026-09-17T02:01:00Z',
    });

    if (hourly.capability !== 'weather.hourlyForecast') throw new Error('unexpected capability');
    if (daily.capability !== 'weather.dailyForecast') throw new Error('unexpected capability');
    expect(hourly.points).toHaveLength(2);
    expect(hourly.points[1]?.validAt).toBe('2026-09-17T03:00:00Z');
    expect(daily.points).toHaveLength(2);
    expect(daily.points[1]?.validDate).toBe('2026-09-18');

    const serialized = JSON.stringify({ current, hourly, daily });
    expect(serialized).not.toContain('fixture-weather-primary');
    expect(serialized).not.toContain('secret://fixture/weather');
  });
});
