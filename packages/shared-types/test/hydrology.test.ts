import { describe, expect, it } from 'vitest';

import {
  HydrologyDischargeRecordSchema,
  HydrologyReturnPeriodRecordSchema,
  RiverReachResolutionSchema,
} from '../src/hydrology.js';

function source() {
  return {
    sourceId: 'geoglows-ecmwf-streamflow',
    providerConfigId: null,
    productId: 'geoglows-v2-forecast',
    productVersion: '2',
    fetchedAt: '2026-09-18T00:05:00Z',
    attributionText: 'GEOGLOWS ECMWF Streamflow Service',
    attributionUrl: 'https://geoglows.ecmwf.int/documentation',
  };
}

function forecastMean() {
  return {
    id: 'hydro:geoglows:123456:2026-09-18T06:00:00Z:mean',
    productKind: 'FORECAST_MEAN' as const,
    riverReachId: 'reach:vn:red-river:001',
    providerReachId: '123456',
    mapping: {
      state: 'MAPPED' as const,
      method: 'PROVIDER_ID' as const,
      confidence: 1,
      distanceKm: 0,
    },
    validAt: '2026-09-18T06:00:00Z',
    modelRunAt: '2026-09-18T00:00:00Z',
    leadSeconds: 21_600,
    dischargeCms: 523.4,
    unit: 'm3/s' as const,
    ensembleMember: null,
    statistic: 'MEAN' as const,
    quality: { state: 'ESTIMATED' as const, flags: [] },
    source: source(),
  };
}

describe('hydrology shared contracts', () => {
  it('accepts an explicitly mapped discharge forecast mean with run/lead provenance', () => {
    expect(HydrologyDischargeRecordSchema.parse(forecastMean())).toMatchObject({
      productKind: 'FORECAST_MEAN',
      riverReachId: 'reach:vn:red-river:001',
      providerReachId: '123456',
      mapping: { state: 'MAPPED', confidence: 1 },
      dischargeCms: 523.4,
      unit: 'm3/s',
      statistic: 'MEAN',
    });
  });

  it('accepts forecast statistics and ensemble members without collapsing their semantics', () => {
    expect(
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        id: 'hydro:geoglows:123456:2026-09-18T06:00:00Z:p75',
        productKind: 'FORECAST_STATISTIC',
        statistic: 'P75',
      }).statistic,
    ).toBe('P75');

    expect(
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        id: 'hydro:geoglows:123456:2026-09-18T06:00:00Z:member-7',
        productKind: 'FORECAST_ENSEMBLE_MEMBER',
        statistic: null,
        ensembleMember: 7,
      }).ensembleMember,
    ).toBe(7);
  });

  it('keeps retrospective simulations distinct from observations and forecast runs', () => {
    expect(
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        id: 'hydro:geoglows:123456:2020-09-18T00:00:00Z:retro',
        productKind: 'RETROSPECTIVE_SIMULATION',
        validAt: '2020-09-18T00:00:00Z',
        modelRunAt: null,
        leadSeconds: null,
        statistic: null,
        quality: { state: 'SIMULATED', flags: ['RETROSPECTIVE'] },
        source: {
          ...source(),
          productId: 'geoglows-v2-retrospective-daily',
        },
      }).productKind,
    ).toBe('RETROSPECTIVE_SIMULATION');
  });

  it('represents return periods as discharge reference thresholds, not probabilities', () => {
    expect(
      HydrologyReturnPeriodRecordSchema.parse({
        id: 'hydro:return-period:123456:20y',
        riverReachId: 'reach:vn:red-river:001',
        providerReachId: '123456',
        mapping: {
          state: 'MAPPED',
          method: 'PROVIDER_ID',
          confidence: 1,
          distanceKm: 0,
        },
        returnPeriodYears: 20,
        dischargeCms: 2_350,
        unit: 'm3/s',
        retrospectivePeriodStart: '1980-01-01T00:00:00Z',
        retrospectivePeriodEnd: '2025-12-31T00:00:00Z',
        source: {
          ...source(),
          productId: 'geoglows-v2-return-periods',
        },
      }),
    ).toMatchObject({
      returnPeriodYears: 20,
      dischargeCms: 2350,
      unit: 'm3/s',
    });
  });

  it('makes mapped, ambiguous and unmapped reach resolution explicit', () => {
    expect(
      RiverReachResolutionSchema.parse({
        state: 'MAPPED',
        providerKey: 'geoglows',
        selectedProviderReachId: '123456',
        candidates: [
          {
            providerReachId: '123456',
            distanceKm: 0.4,
            confidence: 0.97,
          },
        ],
      }).state,
    ).toBe('MAPPED');

    expect(
      RiverReachResolutionSchema.parse({
        state: 'AMBIGUOUS',
        providerKey: 'geoglows',
        selectedProviderReachId: null,
        candidates: [
          { providerReachId: '123456', distanceKm: 0.4, confidence: 0.62 },
          { providerReachId: '123457', distanceKm: 0.5, confidence: 0.6 },
        ],
      }).state,
    ).toBe('AMBIGUOUS');

    expect(
      RiverReachResolutionSchema.parse({
        state: 'UNMAPPED',
        providerKey: 'geoglows',
        selectedProviderReachId: null,
        candidates: [],
      }).state,
    ).toBe('UNMAPPED');
  });

  it('rejects inconsistent mapping resolution states', () => {
    expect(() =>
      RiverReachResolutionSchema.parse({
        state: 'MAPPED',
        providerKey: 'geoglows',
        selectedProviderReachId: null,
        candidates: [],
      }),
    ).toThrow();

    expect(() =>
      RiverReachResolutionSchema.parse({
        state: 'AMBIGUOUS',
        providerKey: 'geoglows',
        selectedProviderReachId: '123456',
        candidates: [
          { providerReachId: '123456', distanceKm: 0.4, confidence: 0.62 },
          { providerReachId: '123457', distanceKm: 0.5, confidence: 0.6 },
        ],
      }),
    ).toThrow();
  });

  it('rejects negative discharge and inconsistent forecast lead time', () => {
    expect(() =>
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        dischargeCms: -0.1,
      }),
    ).toThrow();

    expect(() =>
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        leadSeconds: 3_600,
      }),
    ).toThrow();
  });

  it('rejects stage/water-level fields so discharge cannot masquerade as stage', () => {
    expect(() =>
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        stageM: 4.2,
      }),
    ).toThrow();

    expect(() =>
      HydrologyDischargeRecordSchema.parse({
        ...forecastMean(),
        waterLevelM: 4.2,
      }),
    ).toThrow();
  });
});
