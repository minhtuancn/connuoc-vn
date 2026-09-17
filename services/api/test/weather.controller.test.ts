import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { WeatherController } from '../src/modules/weather/weather.controller.js';
import { WeatherUnavailableError } from '../src/modules/weather/weather.service.js';

const currentResponse = {
  freshness: { state: 'FRESH' as const, staleAfter: '2026-09-17T04:15:00Z' },
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
  fallbackUsed: false,
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

function controllerWith(service: Record<string, unknown>) {
  return new WeatherController(service as never);
}

describe('WeatherController', () => {
  it('parses bounded current coordinates and delegates to the service', async () => {
    const service = { getCurrent: vi.fn(async () => currentResponse) };
    const controller = controllerWith(service);

    await expect(controller.current({ lat: '19.51', lon: '105.51' })).resolves.toEqual(currentResponse);
    expect(service.getCurrent).toHaveBeenCalledWith({ latitude: 19.51, longitude: 105.51 });
  });

  it.each([
    { method: 'current' as const, query: { lat: '91', lon: '105' } },
    { method: 'current' as const, query: { lat: '19', lon: '181' } },
    { method: 'hourly' as const, query: { lat: '19', lon: '105', hours: '0' } },
    { method: 'hourly' as const, query: { lat: '19', lon: '105', hours: '169' } },
    { method: 'daily' as const, query: { lat: '19', lon: '105', days: '0' } },
    { method: 'daily' as const, query: { lat: '19', lon: '105', days: '16' } },
  ])('rejects invalid query for $method', async ({ method, query }) => {
    const controller = controllerWith({
      getCurrent: vi.fn(),
      getHourly: vi.fn(),
      getDaily: vi.fn(),
    });

    await expect(controller[method](query)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps unavailable weather to the bounded public 503 response', async () => {
    const controller = controllerWith({
      getCurrent: vi.fn(async () => { throw new WeatherUnavailableError(); }),
    });

    try {
      await controller.current({ lat: '19.5', lon: '105.5' });
      throw new Error('expected controller to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual({
        statusCode: 503,
        code: 'WEATHER_UNAVAILABLE',
        message: 'Weather data is temporarily unavailable.',
      });
    }
  });
});
