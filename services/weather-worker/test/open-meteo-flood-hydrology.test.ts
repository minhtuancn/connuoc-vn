import { describe, expect, it } from 'vitest';

import { OpenMeteoFloodHydrologyAdapter } from '../src/open-meteo-flood-hydrology.js';
import type { WeatherHttpClient } from '../src/weather-contracts.js';

class FloodFixtureHttpClient implements WeatherHttpClient {
  readonly urls: string[] = [];

  async getJson(url: URL): Promise<unknown> {
    this.urls.push(url.toString());
    const ensemble = url.searchParams.get('ensemble') === 'true';

    return {
      latitude: 19.525,
      longitude: 105.525,
      generationtime_ms: 0.1,
      utc_offset_seconds: 0,
      timezone: 'GMT',
      timezone_abbreviation: 'GMT',
      daily_units: {
        river_discharge: 'm³/s',
        river_discharge_mean: 'm³/s',
        river_discharge_median: 'm³/s',
        river_discharge_max: 'm³/s',
        river_discharge_min: 'm³/s',
        river_discharge_p25: 'm³/s',
        river_discharge_p75: 'm³/s',
      },
      daily: {
        time: ['2026-09-18', '2026-09-19'],
        river_discharge: [510, 530],
        river_discharge_mean: [500, 520],
        river_discharge_median: [495, 515],
        river_discharge_max: [650, 670],
        river_discharge_min: [390, 410],
        river_discharge_p25: [450, 470],
        river_discharge_p75: [560, 580],
        ...(ensemble
          ? {
              river_discharge_member01: [480, 500],
              river_discharge_member02: [525, 545],
            }
          : {}),
      },
    };
  }
}

function createAdapter(client = new FloodFixtureHttpClient()) {
  return {
    client,
    adapter: new OpenMeteoFloodHydrologyAdapter({
      context: {
        providerId: 'provider-open-meteo-flood',
        providerKey: 'open-meteo-flood',
        capabilities: [
          'hydrology.dischargeForecast',
          'hydrology.dischargeEnsemble',
        ],
        secretRef: null,
      },
      httpClient: client,
      baseUrl: 'https://flood-api.open-meteo.com/v1/flood',
      sourceId: 'open-meteo-flood-glofas-v4',
      attributionText: 'Open-Meteo Flood API / GloFAS',
      attributionUrl: 'https://open-meteo.com/en/docs/flood-api',
      modelId: 'forecast_v4',
    }),
  };
}

describe('Open-Meteo Flood / GloFAS hydrology adapter', () => {
  it('maps the returned model grid cell explicitly with low confidence', async () => {
    const { adapter } = createAdapter();
    const result = await adapter.resolveReach({
      latitude: 19.5,
      longitude: 105.5,
    });

    expect(result).toMatchObject({
      state: 'MAPPED',
      providerKey: 'open-meteo-flood',
      selectedProviderReachId: 'glofas-grid:19.52500:105.52500',
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]!.confidence).toBeLessThanOrEqual(0.4);
    expect(result.candidates[0]!.distanceKm).toBeGreaterThan(0);
  });

  it('normalizes daily mean discharge and preserves model-grid uncertainty', async () => {
    const { adapter, client } = createAdapter();
    const result = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:vn:test:002',
      providerReachId: 'glofas-grid:19.52500:105.52500',
      latitude: 19.5,
      longitude: 105.5,
      modelRunAtUtc: '2026-09-18T00:00:00Z',
      days: 2,
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      productKind: 'FORECAST_MEAN',
      providerReachId: 'glofas-grid:19.52500:105.52500',
      validAt: '2026-09-18T00:00:00Z',
      modelRunAt: '2026-09-18T00:00:00Z',
      leadSeconds: 0,
      dischargeCms: 500,
      unit: 'm3/s',
      statistic: 'MEAN',
      mapping: {
        method: 'MODEL_GRID_CELL',
        state: 'MAPPED',
      },
    });
    expect(result.records[0]!.mapping.confidence).toBeLessThanOrEqual(0.4);
    expect(client.urls[0]).toContain('daily=river_discharge_mean');
    expect(client.urls[0]).toContain('models=forecast_v4');
    expect(client.urls[0]).toContain('cell_selection=nearest');
  });

  it('normalizes quantiles and individual flood ensemble members', async () => {
    const { adapter } = createAdapter();
    const result = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeEnsemble',
      riverReachId: 'reach:vn:test:002',
      providerReachId: 'glofas-grid:19.52500:105.52500',
      latitude: 19.5,
      longitude: 105.5,
      modelRunAtUtc: '2026-09-18T00:00:00Z',
      days: 2,
    });

    expect(
      result.records.some(
        (record) =>
          record.productKind === 'FORECAST_STATISTIC' &&
          record.statistic === 'P75' &&
          record.dischargeCms === 560,
      ),
    ).toBe(true);
    expect(
      result.records.some(
        (record) =>
          record.productKind === 'FORECAST_ENSEMBLE_MEMBER' &&
          record.ensembleMember === 1 &&
          record.dischargeCms === 480,
      ),
    ).toBe(true);
  });

  it('rejects provider-grid drift instead of silently switching river cells', async () => {
    const { adapter } = createAdapter();

    await expect(
      adapter.fetchHydrology({
        capability: 'hydrology.dischargeForecast',
        riverReachId: 'reach:vn:test:002',
        providerReachId: 'glofas-grid:19.40000:105.40000',
        latitude: 19.5,
        longitude: 105.5,
        modelRunAtUtc: '2026-09-18T00:00:00Z',
        days: 2,
      }),
    ).rejects.toThrow(/grid/i);
  });

  it('does not claim retrospective or return-period capabilities it cannot provide', async () => {
    const { adapter } = createAdapter();

    await expect(
      adapter.fetchHydrology({
        capability: 'hydrology.retrospective',
        riverReachId: 'reach:vn:test:002',
        providerReachId: 'glofas-grid:19.52500:105.52500',
        latitude: 19.5,
        longitude: 105.5,
        startUtc: '2026-09-01T00:00:00Z',
        endUtc: '2026-09-03T00:00:00Z',
      }),
    ).rejects.toThrow();

    await expect(
      adapter.fetchReturnPeriods({
        riverReachId: 'reach:vn:test:002',
        providerReachId: 'glofas-grid:19.52500:105.52500',
      }),
    ).rejects.toThrow();
  });
});
