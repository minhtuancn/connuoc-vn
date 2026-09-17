import { describe, expect, it } from 'vitest';

import {
  FetchWeatherHttpClient,
  OpenMeteoWeatherAdapter,
  WeatherProviderError,
} from '../src/open-meteo.js';

const context = {
  providerId: 'provider-open-meteo',
  providerKey: 'open-meteo-primary',
  capabilities: [
    'weather.current',
    'weather.hourlyForecast',
    'weather.dailyForecast',
  ] as const,
  secretRef: null,
};

const payload = {
  latitude: 19.5,
  longitude: 105.5,
  timezone: 'GMT',
  current: {
    time: '2026-09-17T02:00',
    temperature_2m: 29.2,
    apparent_temperature: 33.1,
    relative_humidity_2m: 82,
    pressure_msl: 1007.4,
    wind_speed_10m: 2.3,
    wind_gusts_10m: 4.1,
    wind_direction_10m: 110,
    cloud_cover: 75,
    weather_code: 61,
    visibility: 9000,
    uv_index: 7.1,
    precipitation: 1.4,
    rain: 1.4,
  },
  hourly: {
    time: ['2026-09-17T02:00', '2026-09-17T03:00'],
    temperature_2m: [29.2, 28.7],
    apparent_temperature: [33.1, 32.2],
    relative_humidity_2m: [82, 84],
    pressure_msl: [1007.4, 1007.8],
    wind_speed_10m: [2.3, 2.1],
    wind_gusts_10m: [4.1, 3.8],
    wind_direction_10m: [110, 120],
    cloud_cover: [75, 80],
    weather_code: [61, 63],
    visibility: [9000, 8000],
    uv_index: [7.1, 5.2],
    precipitation_probability: [70, 80],
    precipitation: [1.4, 2.1],
    rain: [1.4, 2.1],
  },
  daily: {
    time: ['2026-09-17', '2026-09-18'],
    temperature_2m_min: [25, 24.5],
    temperature_2m_max: [32, 31.2],
    weather_code: [61, 63],
    uv_index_max: [9.2, 8.4],
    precipitation_probability_max: [80, 85],
    precipitation_sum: [12, 18],
    rain_sum: [12, 18],
    wind_speed_10m_max: [8, 9],
    wind_gusts_10m_max: [12, 14],
  },
};

function adapterWith(client: { getJson(url: URL, signal?: AbortSignal): Promise<unknown> }) {
  return new OpenMeteoWeatherAdapter({
    context,
    httpClient: client,
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    sourceId: 'open-meteo-free-hosted',
    attributionText: 'Open-Meteo',
    attributionUrl: 'https://open-meteo.com/',
    modelId: 'best_match',
    now: () => new Date('2026-09-17T02:01:00Z'),
  });
}

describe('Open-Meteo weather adapter', () => {
  it('builds a UTC/SI current request and preserves model-current provenance', async () => {
    let requestedUrl: URL | null = null;
    const adapter = adapterWith({
      async getJson(url) {
        requestedUrl = new URL(url);
        return payload;
      },
    });

    const result = await adapter.fetchWeather({
      capability: 'weather.current',
      latitude: 19.51,
      longitude: 105.51,
    });

    expect(requestedUrl).not.toBeNull();
    expect(requestedUrl?.searchParams.get('timezone')).toBe('UTC');
    expect(requestedUrl?.searchParams.get('temperature_unit')).toBe('celsius');
    expect(requestedUrl?.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(requestedUrl?.searchParams.get('precipitation_unit')).toBe('mm');
    expect(requestedUrl?.searchParams.get('current')).toContain('temperature_2m');
    expect(requestedUrl?.searchParams.get('current')).toContain('uv_index');
    expect(result.capability).toBe('weather.current');
    if (result.capability !== 'weather.current') throw new Error('unexpected capability');
    expect(result.data.kind).toBe('MODEL_CURRENT');
    expect(result.data.validAt).toBe('2026-09-17T02:00:00Z');
    expect(result.data.uvIndex).toBe(7.1);
    expect(result.source.modelRunAt).toBeNull();
    expect(result.source.fetchedAt).toBe('2026-09-17T02:01:00.000Z');
    expect(result.grid).toMatchObject({
      spatialRepresentation: 'GRID_CELL',
      latitude: 19.5,
      longitude: 105.5,
      timeZone: 'UTC',
    });
    expect(JSON.stringify(result)).not.toContain('open-meteo-primary');
  });

  it('uses bounded hourly and daily horizons and normalizes array data', async () => {
    const urls: URL[] = [];
    const adapter = adapterWith({
      async getJson(url) {
        urls.push(new URL(url));
        return payload;
      },
    });

    const hourly = await adapter.fetchWeather({
      capability: 'weather.hourlyForecast',
      latitude: 19.5,
      longitude: 105.5,
      hours: 2,
    });
    const daily = await adapter.fetchWeather({
      capability: 'weather.dailyForecast',
      latitude: 19.5,
      longitude: 105.5,
      days: 2,
    });

    expect(urls[0]?.searchParams.get('forecast_hours')).toBe('2');
    expect(urls[0]?.searchParams.get('hourly')).toContain('precipitation_probability');
    expect(urls[1]?.searchParams.get('forecast_days')).toBe('2');
    expect(urls[1]?.searchParams.get('daily')).toContain('uv_index_max');

    if (hourly.capability !== 'weather.hourlyForecast') throw new Error('unexpected capability');
    if (daily.capability !== 'weather.dailyForecast') throw new Error('unexpected capability');
    expect(hourly.points).toHaveLength(2);
    expect(hourly.points[1]?.validAt).toBe('2026-09-17T03:00:00Z');
    expect(hourly.points[1]?.precipitationProbabilityPct).toBe(80);
    expect(daily.points).toHaveLength(2);
    expect(daily.points[0]?.validDate).toBe('2026-09-17');
    expect(daily.points[0]?.uvIndexMax).toBe(9.2);
  });

  it('uses one explicitly configured model and adds a resolved paid key without leaking it', async () => {
    let requestedUrl: URL | null = null;
    const adapter = new OpenMeteoWeatherAdapter({
      context: { ...context, secretRef: 'env://OPEN_METEO_KEY' },
      httpClient: {
        async getJson(url) {
          requestedUrl = new URL(url);
          return payload;
        },
      },
      baseUrl: 'https://customer-api.open-meteo.com/v1/forecast',
      apiKey: 'CANARY-PAID-KEY',
      sourceId: 'open-meteo-paid-hosted',
      attributionText: 'Open-Meteo',
      attributionUrl: 'https://open-meteo.com/',
      modelId: 'ecmwf_ifs025',
      now: () => new Date('2026-09-17T02:01:00Z'),
    });

    const result = await adapter.fetchWeather({
      capability: 'weather.current',
      latitude: 19.5,
      longitude: 105.5,
    });

    expect(requestedUrl?.searchParams.get('models')).toBe('ecmwf_ifs025');
    expect(requestedUrl?.searchParams.get('apikey')).toBe('CANARY-PAID-KEY');
    expect(JSON.stringify(result)).not.toContain('CANARY-PAID-KEY');
    expect(JSON.stringify(result)).not.toContain('env://OPEN_METEO_KEY');
  });

  it('rejects mismatched hourly arrays as a non-retryable payload error', async () => {
    const badPayload = {
      ...payload,
      hourly: {
        ...payload.hourly,
        temperature_2m: [29.2],
      },
    };
    const adapter = adapterWith({ async getJson() { return badPayload; } });

    await expect(
      adapter.fetchWeather({
        capability: 'weather.hourlyForecast',
        latitude: 19.5,
        longitude: 105.5,
        hours: 2,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PAYLOAD', retryable: false });
  });

  it('treats 429/5xx and network failures as retryable without copying response bodies', async () => {
    const secretBody = 'vendor body containing CANARY-SECRET';
    const client429 = new FetchWeatherHttpClient(async () =>
      new Response(secretBody, { status: 429 }),
    );
    const adapter429 = adapterWith(client429);

    const failure429 = await adapter429
      .fetchWeather({ capability: 'weather.current', latitude: 19.5, longitude: 105.5 })
      .catch((error: unknown) => error);
    expect(failure429).toBeInstanceOf(WeatherProviderError);
    expect(failure429).toMatchObject({ code: 'HTTP_RETRYABLE', retryable: true, statusCode: 429 });
    expect(String(failure429)).not.toContain('CANARY-SECRET');

    const networkAdapter = adapterWith(
      new FetchWeatherHttpClient(async () => {
        throw new Error('socket closed');
      }),
    );
    await expect(
      networkAdapter.fetchWeather({
        capability: 'weather.current',
        latitude: 19.5,
        longitude: 105.5,
      }),
    ).rejects.toMatchObject({ code: 'NETWORK', retryable: true });
  });
});
