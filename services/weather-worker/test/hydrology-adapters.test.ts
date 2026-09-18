import { describe, expect, it } from 'vitest';

import { FixtureHydrologyAdapter } from '../src/hydrology-fixture.js';

const context = {
  providerId: 'provider-hydro-fixture',
  providerKey: 'fixture-hydrology',
  capabilities: [
    'hydrology.dischargeForecast',
    'hydrology.dischargeEnsemble',
    'hydrology.retrospective',
    'hydrology.returnPeriods',
  ] as const,
  secretRef: 'secret://hydrology/fixture',
};

describe('Phase 5D fixture hydrology adapter', () => {
  it('resolves mapped, ambiguous and unmapped river reaches explicitly', async () => {
    const adapter = new FixtureHydrologyAdapter({ context });

    await expect(
      adapter.resolveReach({ latitude: 19.5, longitude: 105.5 }),
    ).resolves.toMatchObject({
      state: 'MAPPED',
      selectedProviderReachId: 'fixture-reach-001',
    });

    await expect(
      adapter.resolveReach({ latitude: 19.7, longitude: 105.7 }),
    ).resolves.toMatchObject({
      state: 'AMBIGUOUS',
      selectedProviderReachId: null,
    });

    await expect(
      adapter.resolveReach({ latitude: 10, longitude: 110 }),
    ).resolves.toEqual({
      state: 'UNMAPPED',
      providerKey: 'fixture-hydrology',
      selectedProviderReachId: null,
      candidates: [],
    });
  });

  it('returns normalized mean forecast with exact run/lead semantics', async () => {
    const adapter = new FixtureHydrologyAdapter({ context });
    const result = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
      days: 2,
    });

    expect(result.capability).toBe('hydrology.dischargeForecast');
    expect(result.records).toHaveLength(4);
    expect(result.records[0]).toMatchObject({
      productKind: 'FORECAST_MEAN',
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
      modelRunAt: '2026-09-18T00:00:00Z',
      leadSeconds: 21600,
      unit: 'm3/s',
      statistic: 'MEAN',
    });
  });

  it('preserves ensemble members and statistics instead of collapsing them', async () => {
    const adapter = new FixtureHydrologyAdapter({ context });
    const result = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeEnsemble',
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
      days: 1,
    });

    expect(result.records.some((record) => record.productKind === 'FORECAST_STATISTIC')).toBe(true);
    expect(
      result.records.some(
        (record) =>
          record.productKind === 'FORECAST_ENSEMBLE_MEMBER' &&
          record.ensembleMember === 1,
      ),
    ).toBe(true);
  });

  it('keeps retrospective data simulated and returns discharge reference periods', async () => {
    const adapter = new FixtureHydrologyAdapter({ context });

    const retrospective = await adapter.fetchHydrology({
      capability: 'hydrology.retrospective',
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
      startUtc: '2026-09-01T00:00:00Z',
      endUtc: '2026-09-03T00:00:00Z',
    });
    expect(retrospective.records.every((record) => record.productKind === 'RETROSPECTIVE_SIMULATION')).toBe(true);
    expect(retrospective.records.every((record) => record.quality.state === 'SIMULATED')).toBe(true);

    const returnPeriods = await adapter.fetchReturnPeriods({
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
    });
    expect(returnPeriods.records.map((record) => record.returnPeriodYears)).toEqual([2, 5, 10, 20, 50, 100]);
    expect(returnPeriods.records.every((record) => record.unit === 'm3/s')).toBe(true);
  });

  it('never leaks provider secret context in normalized output', async () => {
    const adapter = new FixtureHydrologyAdapter({ context });
    const forecast = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:fixture:001',
      providerReachId: 'fixture-reach-001',
      days: 1,
    });
    expect(JSON.stringify(forecast)).not.toContain('secret://hydrology/fixture');
  });
});
