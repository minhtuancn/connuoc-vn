import { describe, expect, it } from 'vitest';

import type { ProviderContext } from '../src/contracts.js';
import { normalizeImergGridCell } from '../src/imerg-normalizer.js';
import { OpenMeteoRainfallAdapter } from '../src/open-meteo-rainfall.js';
import { FixtureRainfallAdapter } from '../src/rainfall-fixture.js';

const context: ProviderContext = {
  providerId: 'provider:rain:test',
  providerKey: 'rain-test',
  capabilities: [
    'rainfall.observed',
    'rainfall.satellite',
    'rainfall.forecast',
  ],
  secretRef: null,
};

describe('rainfall provider adapters', () => {
  it('fixture produces explicitly labeled gauge, satellite and forecast records from an injected clock', async () => {
    const adapter = new FixtureRainfallAdapter({
      context,
      sourceId: 'fixture-rainfall',
      attributionText: 'Con Nước rainfall fixture',
      stationId: 'station:fixture:rain',
      now: () => new Date('2026-09-17T03:00:00Z'),
    });

    const gauge = await adapter.fetchRainfall({
      capability: 'rainfall.observed',
      latitude: 19.5,
      longitude: 105.5,
    });
    const satellite = await adapter.fetchRainfall({
      capability: 'rainfall.satellite',
      latitude: 19.5,
      longitude: 105.5,
    });
    const forecast = await adapter.fetchRainfall({
      capability: 'rainfall.forecast',
      latitude: 19.5,
      longitude: 105.5,
      hours: 2,
    });

    expect(gauge.records[0]).toMatchObject({
      productKind: 'GAUGE_OBSERVATION',
      validStart: '2026-09-17T02:30:00Z',
      validEnd: '2026-09-17T03:00:00Z',
      accumulationSeconds: 1800,
      spatial: { representation: 'GAUGE', stationId: 'station:fixture:rain' },
    });
    expect(satellite.records[0]).toMatchObject({
      productKind: 'SATELLITE_ESTIMATE',
      spatial: { representation: 'GRID_CELL', stationId: null },
    });
    expect(forecast.records).toHaveLength(2);
    expect(forecast.records[0]).toMatchObject({
      productKind: 'DETERMINISTIC_FORECAST',
      validStart: '2026-09-17T03:00:00Z',
      validEnd: '2026-09-17T04:00:00Z',
      accumulationSeconds: 3600,
    });
  });

  it('Open-Meteo normalizes hourly precipitation as preceding-hour deterministic forecast totals', async () => {
    const requestedUrls: string[] = [];
    const adapter = new OpenMeteoRainfallAdapter({
      context: {
        ...context,
        capabilities: ['rainfall.forecast'],
      },
      httpClient: {
        async getJson(url) {
          requestedUrls.push(url.toString());
          return {
            latitude: 19.5,
            longitude: 105.5,
            timezone: 'GMT',
            hourly: {
              time: ['2026-09-17T04:00', '2026-09-17T05:00'],
              precipitation: [1.2, 2.4],
              rain: [1.0, 2.0],
            },
          };
        },
      },
      baseUrl: 'https://api.open-meteo.com/v1/forecast',
      sourceId: 'open-meteo',
      attributionText: 'Open-Meteo',
      attributionUrl: 'https://open-meteo.com/',
      modelId: 'best_match',
      now: () => new Date('2026-09-17T03:05:00Z'),
    });

    const result = await adapter.fetchRainfall({
      capability: 'rainfall.forecast',
      latitude: 19.51,
      longitude: 105.51,
      hours: 2,
    });

    expect(requestedUrls[0]).toContain('hourly=precipitation%2Crain');
    expect(requestedUrls[0]).toContain('timezone=UTC');
    expect(requestedUrls[0]).toContain('forecast_hours=2');
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      productKind: 'DETERMINISTIC_FORECAST',
      validStart: '2026-09-17T03:00:00Z',
      validEnd: '2026-09-17T04:00:00Z',
      accumulationSeconds: 3600,
      amountMm: 1.2,
      spatial: {
        representation: 'GRID_CELL',
        latitude: 19.5,
        longitude: 105.5,
      },
      source: {
        sourceId: 'open-meteo',
        productId: 'open-meteo-hourly-precipitation',
        productVersion: 'best_match',
        fetchedAt: '2026-09-17T03:05:00Z',
      },
    });
  });

  it('IMERG normalizer converts an explicit half-hour rate to accumulation and preserves object-store lineage', () => {
    const result = normalizeImergGridCell({
      sourceId: 'nasa-gpm-imerg',
      productId: 'IMERG-Early',
      productVersion: 'V07B',
      validStart: '2026-09-17T01:30:00Z',
      validEnd: '2026-09-17T02:00:00Z',
      value: 8.4,
      valueSemantics: 'RATE_MM_PER_HOUR',
      latitude: 19.5,
      longitude: 105.5,
      resolutionKm: 10,
      fetchedAt: '2026-09-17T06:00:00Z',
      attributionText: 'NASA GPM IMERG',
      attributionUrl: 'https://gpm.nasa.gov/data/imerg',
      objectReference: {
        uri: 's3://hydro/imerg/2026/09/17/0200.tif',
        checksumSha256: 'c'.repeat(64),
        mediaType: 'image/tiff; application=geotiff',
      },
    });

    expect(result.capability).toBe('rainfall.satellite');
    expect(result.records[0]).toMatchObject({
      productKind: 'SATELLITE_ESTIMATE',
      accumulationSeconds: 1800,
      amountMm: 4.2,
      spatial: {
        representation: 'GRID_CELL',
        resolutionKm: 10,
        stationId: null,
      },
      quality: { state: 'ESTIMATED' },
      source: {
        sourceId: 'nasa-gpm-imerg',
        productId: 'IMERG-Early',
        productVersion: 'V07B',
      },
    });
    expect(result.objectReferences).toEqual([
      {
        uri: 's3://hydro/imerg/2026/09/17/0200.tif',
        checksumSha256: 'c'.repeat(64),
        mediaType: 'image/tiff; application=geotiff',
      },
    ]);
  });

  it('IMERG normalizer never guesses invalid or missing value semantics', () => {
    expect(() =>
      normalizeImergGridCell({
        sourceId: 'nasa-gpm-imerg',
        productId: 'IMERG-Early',
        productVersion: 'V07B',
        validStart: '2026-09-17T01:30:00Z',
        validEnd: '2026-09-17T02:00:00Z',
        value: 8.4,
        valueSemantics: 'UNKNOWN' as 'RATE_MM_PER_HOUR',
        latitude: 19.5,
        longitude: 105.5,
        resolutionKm: 10,
        fetchedAt: '2026-09-17T06:00:00Z',
        attributionText: 'NASA GPM IMERG',
        attributionUrl: 'https://gpm.nasa.gov/data/imerg',
        objectReference: null,
      }),
    ).toThrow(/semantics/i);
  });
});
