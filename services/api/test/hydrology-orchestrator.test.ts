import { describe, expect, it, vi } from 'vitest';

import {
  FixtureHydrologyAdapter,
  type HydrologyProviderAdapter,
} from '@connuoc/weather-worker';

import {
  HydrologyOrchestrationError,
  HydrologyOrchestrator,
  type HydrologyLastKnownGoodResult,
} from '../src/modules/hydrology/hydrology-orchestrator.js';
import type { HydrologyAdapterFactoryPort } from '../src/modules/hydrology/hydrology-adapter.factory.js';
import type {
  HydrologyProviderRuntimeStore,
  HydrologyRuntimeProvider,
} from '../src/modules/hydrology/hydrology-provider.repository.js';

function provider(
  providerId: string,
  priority: number,
  commercialUseStatus: 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN' = 'ALLOWED',
): HydrologyRuntimeProvider {
  return {
    providerId,
    providerKey: providerId,
    providerType: 'fixture',
    sourceRegistryId: 'synthetic-hydrology-fixture',
    endpointConfig: {},
    secretRef: null,
    modelAllowList: [],
    freshnessSeconds: 3600,
    selectable: {
      providerId,
      providerKey: providerId,
      enabled: true,
      priority,
      weight: 1,
      capabilities: ['hydrology.dischargeForecast'],
      coversLocation: true,
      commercialUseStatus,
      healthState: 'HEALTHY',
      healthBlocksSelection: false,
      quotaAvailable: true,
      budgetAvailable: true,
      effectiveFromUtc: null,
      effectiveToUtc: null,
    },
    attribution: {
      text: 'Synthetic hydrology fixture',
      url: null,
    },
  };
}

function fixtureAdapter(
  runtime: HydrologyRuntimeProvider,
): HydrologyProviderAdapter {
  return new FixtureHydrologyAdapter({
    context: {
      providerId: runtime.providerId,
      providerKey: runtime.providerKey,
      capabilities: runtime.selectable.capabilities,
      secretRef: runtime.secretRef,
    },
    sourceId: runtime.sourceRegistryId,
    attributionText: runtime.attribution.text,
    attributionUrl: runtime.attribution.url,
    now: () => new Date('2026-09-18T00:00:00Z'),
  });
}

function mapped(providerKey: string, providerReachId: string) {
  return {
    state: 'MAPPED' as const,
    providerKey,
    selectedProviderReachId: providerReachId,
    candidates: [
      {
        providerReachId,
        distanceKm: 0.2,
        confidence: 0.98,
      },
    ],
  };
}

function request() {
  return {
    capability: 'hydrology.dischargeForecast' as const,
    riverReachId: 'reach:fixture:001',
    latitude: 19.5,
    longitude: 105.5,
    atUtc: '2026-09-18T00:05:00Z',
    modelRunAtUtc: '2026-09-18T00:00:00Z',
    days: 2,
    deploymentUse: 'COMMERCIAL' as const,
  };
}

describe('HydrologyOrchestrator', () => {
  it('skips an ambiguous preferred mapping and uses the next mapped provider', async () => {
    const preferred = provider('preferred', 200);
    const fallback = provider('fallback', 100);
    const health = vi.fn();

    const store: HydrologyProviderRuntimeStore = {
      listRuntimeProviders: vi.fn().mockResolvedValue([preferred, fallback]),
      recordHealthEvent: health,
    };
    const reachStore = {
      findProviderResolution: vi.fn(async ({ providerConfigId }: { providerConfigId: string }) =>
        providerConfigId === 'preferred'
          ? {
              state: 'AMBIGUOUS' as const,
              providerKey: 'preferred',
              selectedProviderReachId: null,
              candidates: [
                {
                  providerReachId: '111111111',
                  distanceKm: 0.4,
                  confidence: 0.62,
                },
                {
                  providerReachId: '111111112',
                  distanceKm: 0.5,
                  confidence: 0.6,
                },
              ],
            }
          : mapped('fallback', '222222222'),
      ),
    };
    const factory: HydrologyAdapterFactoryPort = {
      create: vi.fn(async (runtime) => fixtureAdapter(runtime)),
    };
    const lkgStore = {
      findLastKnownGood: vi.fn().mockResolvedValue(null),
    };

    const orchestrator = new HydrologyOrchestrator(
      store,
      factory,
      reachStore,
      lkgStore,
      { lkgStaleGraceSeconds: 21_600 },
      () => 1000,
    );

    const result = await orchestrator.fetch(request());

    expect(result.providerConfigId).toBe('fallback');
    expect(result.providerReachId).toBe('222222222');
    expect(result.fallbackUsed).toBe(true);
    expect(result.lastKnownGoodUsed).toBe(false);
    expect(result.mapping.state).toBe('MAPPED');
    expect(factory.create).toHaveBeenCalledTimes(1);
    expect(health).toHaveBeenCalledWith(
      'fallback',
      'HEALTHY',
      0,
      null,
    );
  });

  it('lets deployment policy reject UNKNOWN commercial-use providers before adapter creation', async () => {
    const blocked = provider('blocked', 200, 'UNKNOWN');
    const allowed = provider('allowed', 100, 'ALLOWED');

    const store: HydrologyProviderRuntimeStore = {
      listRuntimeProviders: vi.fn().mockResolvedValue([blocked, allowed]),
      recordHealthEvent: vi.fn(),
    };
    const reachStore = {
      findProviderResolution: vi.fn(async ({ providerConfigId }: { providerConfigId: string }) =>
        mapped(providerConfigId, providerConfigId === 'allowed' ? '333333333' : '999999999'),
      ),
    };
    const factory: HydrologyAdapterFactoryPort = {
      create: vi.fn(async (runtime) => fixtureAdapter(runtime)),
    };

    const orchestrator = new HydrologyOrchestrator(
      store,
      factory,
      reachStore,
      { findLastKnownGood: vi.fn().mockResolvedValue(null) },
      { lkgStaleGraceSeconds: 21_600 },
    );

    const result = await orchestrator.fetch(request());

    expect(result.providerConfigId).toBe('allowed');
    expect(reachStore.findProviderResolution).not.toHaveBeenCalledWith(
      expect.objectContaining({ providerConfigId: 'blocked' }),
    );
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  it('falls back to a compatible persisted LKG after live provider failure', async () => {
    const live = provider('live', 100);
    const store: HydrologyProviderRuntimeStore = {
      listRuntimeProviders: vi.fn().mockResolvedValue([live]),
      recordHealthEvent: vi.fn(),
    };
    const reachStore = {
      findProviderResolution: vi.fn().mockResolvedValue(
        mapped('live', '444444444'),
      ),
    };
    const failingAdapter = fixtureAdapter(live);
    vi.spyOn(failingAdapter, 'fetchHydrology').mockRejectedValue(
      Object.assign(new Error('provider failed'), {
        code: 'PROVIDER_FAILURE',
      }),
    );
    const factory: HydrologyAdapterFactoryPort = {
      create: vi.fn().mockResolvedValue(failingAdapter),
    };

    const cachedAdapter = fixtureAdapter(live);
    const cachedBundle = await cachedAdapter.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:fixture:001',
      providerReachId: '444444444',
      days: 2,
    });
    const cached: HydrologyLastKnownGoodResult = {
      runId: 'run-lkg-1',
      providerConfigId: 'live',
      providerReachId: '444444444',
      freshnessSeconds: 3600,
      staleAfterUtc: '2026-09-18T01:00:00Z',
      mapping: mapped('live', '444444444'),
      bundle: cachedBundle,
    };
    const lkgStore = {
      findLastKnownGood: vi.fn().mockResolvedValue(cached),
    };

    const orchestrator = new HydrologyOrchestrator(
      store,
      factory,
      reachStore,
      lkgStore,
      { lkgStaleGraceSeconds: 21_600 },
      () => 1000,
    );

    const result = await orchestrator.fetch(request());

    expect(result.lastKnownGoodUsed).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.bundle).toEqual(cachedBundle);
    expect(lkgStore.findLastKnownGood).toHaveBeenCalledWith({
      riverReachPublicId: 'reach:fixture:001',
      capability: 'hydrology.dischargeForecast',
      atUtc: '2026-09-18T00:05:00Z',
      staleGraceSeconds: 21_600,
    });
  });

  it('fails closed when no provider has a mapped reach and no LKG exists', async () => {
    const only = provider('only', 100);
    const store: HydrologyProviderRuntimeStore = {
      listRuntimeProviders: vi.fn().mockResolvedValue([only]),
      recordHealthEvent: vi.fn(),
    };

    const orchestrator = new HydrologyOrchestrator(
      store,
      { create: vi.fn(async (runtime) => fixtureAdapter(runtime)) },
      {
        findProviderResolution: vi.fn().mockResolvedValue({
          state: 'UNMAPPED',
          providerKey: 'only',
          selectedProviderReachId: null,
          candidates: [],
        }),
      },
      { findLastKnownGood: vi.fn().mockResolvedValue(null) },
      { lkgStaleGraceSeconds: 21_600 },
    );

    await expect(orchestrator.fetch(request())).rejects.toMatchObject({
      code: 'NO_PROVIDER_AVAILABLE',
    });
  });

  it('rejects invalid policy instead of silently accepting an unbounded stale grace', () => {
    expect(
      () =>
        new HydrologyOrchestrator(
          {
            listRuntimeProviders: vi.fn(),
            recordHealthEvent: vi.fn(),
          },
          { create: vi.fn() },
          { findProviderResolution: vi.fn() },
          { findLastKnownGood: vi.fn() },
          { lkgStaleGraceSeconds: 31_536_001 },
        ),
    ).toThrow();

    expect(
      new HydrologyOrchestrationError('NO_PROVIDER_AVAILABLE').code,
    ).toBe('NO_PROVIDER_AVAILABLE');
  });
});
