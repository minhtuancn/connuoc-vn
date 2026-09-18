import { describe, expect, it } from 'vitest';

import { GeoglowsHydrologyAdapter } from '../src/geoglows-hydrology.js';
import type { WeatherHttpClient } from '../src/weather-contracts.js';

class FixtureHttpClient implements WeatherHttpClient {
  readonly urls: string[] = [];

  async getJson(url: URL): Promise<unknown> {
    this.urls.push(url.toString());

    if (url.pathname.endsWith('/v2/getriverid')) {
      return { river_id: 123456789 };
    }

    if (url.pathname.includes('/v2/forecaststats/')) {
      return {
        metadata: {
          river_id: 123456789,
          gen_date: '2026-09-18T12:00:00+00:00',
          start_date: '2026-09-18T03:00:00+00:00',
          end_date: '2026-09-18T06:00:00+00:00',
          units: {
            name: 'streamflow',
            short: 'cms',
            long: 'cubic meters per second',
          },
        },
        datetime: [
          '2026-09-18T03:00:00+00:00',
          '2026-09-18T06:00:00+00:00',
        ],
        flow_max: [700, 720],
        flow_75p: [650, 670],
        flow_avg: [600, 620],
        flow_med: [590, 610],
        flow_25p: [540, 560],
        flow_min: [500, 520],
        high_res: [610, 630],
      };
    }

    if (url.pathname.includes('/v2/forecastensemble/')) {
      return {
        metadata: {
          river_id: 123456789,
          gen_date: '2026-09-18T12:00:00+00:00',
          start_date: '2026-09-18T03:00:00+00:00',
          end_date: '2026-09-18T06:00:00+00:00',
          units: { short: 'cms' },
        },
        datetime: [
          '2026-09-18T03:00:00+00:00',
          '2026-09-18T06:00:00+00:00',
        ],
        ensemble_01: [580, 600],
        ensemble_02: [620, 640],
      };
    }

    if (url.pathname.includes('/v2/retrospectivedaily/')) {
      return {
        metadata: {
          river_id: 123456789,
          gen_date: '2026-09-18T12:00:00+00:00',
          start_date: '2026-09-01T00:00:00+00:00',
          end_date: '2026-09-02T00:00:00+00:00',
          units: { short: 'cms' },
        },
        datetime: [
          '2026-09-01T00:00:00+00:00',
          '2026-09-02T00:00:00+00:00',
        ],
        '123456789': [450, 460],
      };
    }

    if (url.pathname.includes('/v2/returnperiods/')) {
      return {
        return_periods: {
          '2': 700,
          '5': 900,
          '10': 1100,
          '25': 1300,
          '50': 1500,
          '100': 1800,
        },
        river_id: 123456789,
        gen_date: '2026-09-18T12:00:00+00:00',
        units: {
          name: 'streamflow',
          short: 'cms',
          long: 'cubic meters per second',
        },
      };
    }

    throw new Error(`Unexpected fixture URL: ${url.toString()}`);
  }
}

function adapter(client = new FixtureHttpClient()) {
  return {
    client,
    adapter: new GeoglowsHydrologyAdapter({
      context: {
        providerId: 'provider-geoglows',
        providerKey: 'geoglows',
        capabilities: [
          'hydrology.dischargeForecast',
          'hydrology.dischargeEnsemble',
          'hydrology.retrospective',
          'hydrology.returnPeriods',
        ],
        secretRef: null,
      },
      httpClient: client,
      baseUrl: 'https://geoglows.ecmwf.int/api/',
      sourceId: 'geoglows-ecmwf-streamflow',
      attributionText: 'GEOGLOWS ECMWF Streamflow Service',
      attributionUrl: 'https://geoglows.ecmwf.int/documentation',
      productVersion: '2',
    }),
  };
}

describe('GEOGLOWS v2 hydrology adapter', () => {
  it('uses getriverid but marks nearest-only lookup with bounded confidence', async () => {
    const { adapter: instance } = adapter();

    await expect(
      instance.resolveReach({ latitude: 19.5, longitude: 105.5 }),
    ).resolves.toEqual({
      state: 'MAPPED',
      providerKey: 'geoglows',
      selectedProviderReachId: '123456789',
      candidates: [
        {
          providerReachId: '123456789',
          distanceKm: null,
          confidence: 0.5,
        },
      ],
    });
  });

  it('normalizes forecast mean in m3/s with exact model run and lead time', async () => {
    const { adapter: instance, client } = adapter();
    const result = await instance.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:vn:test:001',
      providerReachId: '123456789',
      modelRunAtUtc: '2026-09-18T00:00:00Z',
      days: 1,
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      productKind: 'FORECAST_MEAN',
      validAt: '2026-09-18T03:00:00Z',
      modelRunAt: '2026-09-18T00:00:00Z',
      leadSeconds: 10800,
      dischargeCms: 600,
      unit: 'm3/s',
      statistic: 'MEAN',
    });
    expect(client.urls[0]).toContain('/v2/forecaststats/123456789');
    expect(client.urls[0]).toContain('format=json');
    expect(client.urls[0]).toContain('date=20260918');
  });

  it('retains forecast statistics and individual ensemble members', async () => {
    const { adapter: instance } = adapter();
    const result = await instance.fetchHydrology({
      capability: 'hydrology.dischargeEnsemble',
      riverReachId: 'reach:vn:test:001',
      providerReachId: '123456789',
      modelRunAtUtc: '2026-09-18T00:00:00Z',
      days: 1,
    });

    expect(
      result.records.some(
        (record) =>
          record.productKind === 'FORECAST_STATISTIC' &&
          record.statistic === 'P75' &&
          record.dischargeCms === 650,
      ),
    ).toBe(true);
    expect(
      result.records.some(
        (record) =>
          record.productKind === 'FORECAST_ENSEMBLE_MEMBER' &&
          record.ensembleMember === 1 &&
          record.dischargeCms === 580,
      ),
    ).toBe(true);
  });

  it('normalizes daily retrospective as simulation, never observation', async () => {
    const { adapter: instance } = adapter();
    const result = await instance.fetchHydrology({
      capability: 'hydrology.retrospective',
      riverReachId: 'reach:vn:test:001',
      providerReachId: '123456789',
      startUtc: '2026-09-01T00:00:00Z',
      endUtc: '2026-09-02T23:59:59Z',
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      productKind: 'RETROSPECTIVE_SIMULATION',
      quality: { state: 'SIMULATED' },
      dischargeCms: 450,
      unit: 'm3/s',
    });
  });

  it('normalizes return periods as discharge thresholds without probability', async () => {
    const { adapter: instance } = adapter();
    const result = await instance.fetchReturnPeriods({
      riverReachId: 'reach:vn:test:001',
      providerReachId: '123456789',
    });

    expect(result.records.map((record) => record.returnPeriodYears)).toEqual([
      2, 5, 10, 25, 50, 100,
    ]);
    expect(result.records[3]).toMatchObject({
      returnPeriodYears: 25,
      dischargeCms: 1300,
      unit: 'm3/s',
      retrospectivePeriodStart: null,
      retrospectivePeriodEnd: null,
    });
    expect(JSON.stringify(result)).not.toContain('probability');
  });

  it('fails closed on negative or malformed streamflow values', async () => {
    const client: WeatherHttpClient = {
      async getJson(url) {
        if (url.pathname.includes('/forecaststats/')) {
          return {
            metadata: { river_id: 123456789, units: { short: 'cms' } },
            datetime: ['2026-09-18T03:00:00+00:00'],
            flow_avg: [-1],
          };
        }
        return { river_id: 123456789 };
      },
    };
    const instance = adapter(client as FixtureHttpClient).adapter;

    await expect(
      instance.fetchHydrology({
        capability: 'hydrology.dischargeForecast',
        riverReachId: 'reach:vn:test:001',
        providerReachId: '123456789',
        modelRunAtUtc: '2026-09-18T00:00:00Z',
      }),
    ).rejects.toThrow();
  });
});
