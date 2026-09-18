import { describe, expect, it, vi } from 'vitest';

import type { NormalizedRainfallBundle } from '@connuoc/weather-worker';

import type { RainfallAdapterFactoryPort } from '../src/modules/rainfall/rainfall-adapter.factory.js';
import {
  RainfallOrchestrator,
  type RainfallLastKnownGoodStore,
} from '../src/modules/rainfall/rainfall-orchestrator.js';
import type {
  RainfallProviderRuntimeStore,
  RainfallRuntimeProvider,
} from '../src/modules/rainfall/rainfall-provider.repository.js';

function provider(
  providerId: string,
  priority: number,
  overrides: Partial<RainfallRuntimeProvider> = {},
): RainfallRuntimeProvider {
  const selectable = {
    providerId,
    providerKey: `${providerId}-key`,
    enabled: true,
    priority,
    weight: 1,
    capabilities: ['rainfall.forecast'] as const,
    coversLocation: true,
    commercialUseStatus: 'ALLOWED' as const,
    healthState: 'HEALTHY' as const,
    healthBlocksSelection: false,
    quotaAvailable: true,
    budgetAvailable: true,
    effectiveFromUtc: null,
    effectiveToUtc: null,
  };

  return {
    providerId,
    providerKey: `${providerId}-key`,
    providerType: 'fixture',
    sourceRegistryId: `${providerId}-source`,
    endpointConfig: {},
    secretRef: null,
    modelAllowList: [],
    freshnessSeconds: 900,
    attribution: { text: `${providerId} attribution`, url: null },
    selectable,
    ...overrides,
  };
}

function forecastBundle(sourceId: string): NormalizedRainfallBundle {
  return {
    capability: 'rainfall.forecast',
    records: [
      {
        id: `rain:${sourceId}:0500`,
        productKind: 'DETERMINISTIC_FORECAST',
        validStart: '2026-09-17T04:00:00Z',
        validEnd: '2026-09-17T05:00:00Z',
        accumulationSeconds: 3600,
        amountMm: 2.4,
        unit: 'mm',
        spatial: {
          representation: 'GRID_CELL',
          latitude: 19.5,
          longitude: 105.5,
          resolutionKm: 5,
          stationId: null,
        },
        quality: { state: 'ESTIMATED', flags: ['TEST'] },
        source: {
          sourceId,
          providerConfigId: null,
          productId: 'test-rainfall',
          productVersion: '1',
          modelRunAt: '2026-09-17T03:00:00Z',
          observedAt: null,
          fetchedAt: '2026-09-17T03:05:00Z',
          attributionText: `${sourceId} attribution`,
          attributionUrl: null,
        },
      },
    ],
  };
}

function runtimeStore(providers: readonly RainfallRuntimeProvider[]): RainfallProviderRuntimeStore {
  return {
    listRuntimeProviders: vi.fn(async () => providers),
    recordHealthEvent: vi.fn(async () => undefined),
  };
}

function adapterFactory(
  behavior: (runtimeProvider: RainfallRuntimeProvider) => Promise<NormalizedRainfallBundle>,
): RainfallAdapterFactoryPort {
  return {
    create: vi.fn(async (runtimeProvider) => ({
      providerType: 'test',
      context: {
        providerId: runtimeProvider.providerId,
        providerKey: runtimeProvider.providerKey,
        capabilities: runtimeProvider.selectable.capabilities,
        secretRef: runtimeProvider.secretRef,
      },
      supports: () => true,
      healthCheck: async () => ({
        state: 'HEALTHY' as const,
        latencyMs: 0,
        providerId: runtimeProvider.providerId,
        providerKey: runtimeProvider.providerKey,
        details: {},
      }),
      fetchRainfall: async () => behavior(runtimeProvider),
    })),
  };
}

function lkgStore(
  value: Awaited<ReturnType<RainfallLastKnownGoodStore['findNearestLastKnownGood']>>,
): RainfallLastKnownGoodStore {
  return {
    findNearestLastKnownGood: vi.fn(async () => value),
  };
}

const request = {
  capability: 'rainfall.forecast' as const,
  latitude: 19.51,
  longitude: 105.51,
  hours: 2,
  atUtc: '2026-09-17T04:00:00Z',
  deploymentUse: 'COMMERCIAL' as const,
};

const policy = {
  lkgMaxDistanceKm: 25,
  lkgStaleGraceSeconds: 3600,
} as const;

describe('rainfall provider orchestration', () => {
  it('skips a higher-priority policy-blocked provider and uses an allowed live fallback', async () => {
    const blockedBase = provider('blocked', 200);
    const blocked = provider('blocked', 200, {
      selectable: {
        ...blockedBase.selectable,
        commercialUseStatus: 'RESTRICTED',
      },
    });
    const store = runtimeStore([blocked, provider('allowed', 100)]);
    const factory = adapterFactory(async (runtimeProvider) =>
      forecastBundle(runtimeProvider.sourceRegistryId),
    );
    const cache = lkgStore(null);
    const orchestrator = new RainfallOrchestrator(store, factory, cache, policy, () => 1000);

    await expect(orchestrator.fetch(request)).resolves.toMatchObject({
      providerConfigId: 'allowed',
      freshnessSeconds: 900,
      fallbackUsed: true,
      lastKnownGoodUsed: false,
      bundle: { records: [{ source: { sourceId: 'allowed-source' } }] },
    });
    expect(factory.create).toHaveBeenCalledTimes(1);
    expect(cache.findNearestLastKnownGood).not.toHaveBeenCalled();
  });

  it('falls back to the next eligible live provider after an upstream failure', async () => {
    const store = runtimeStore([provider('preferred', 200), provider('backup', 100)]);
    const factory = adapterFactory(async (runtimeProvider) => {
      if (runtimeProvider.providerId === 'preferred') {
        const error = new Error('upstream timeout') as Error & { code: string };
        error.code = 'NETWORK';
        throw error;
      }
      return forecastBundle(runtimeProvider.sourceRegistryId);
    });
    const orchestrator = new RainfallOrchestrator(
      store,
      factory,
      lkgStore(null),
      policy,
      () => 1000,
    );

    const result = await orchestrator.fetch(request);
    expect(result).toMatchObject({
      providerConfigId: 'backup',
      fallbackUsed: true,
      lastKnownGoodUsed: false,
    });
    expect(store.recordHealthEvent).toHaveBeenCalledWith(
      'preferred',
      'DEGRADED',
      0,
      'NETWORK',
    );
  });

  it('uses spatially compatible LKG within stale grace only after all live providers fail', async () => {
    const store = runtimeStore([provider('preferred', 100)]);
    const factory = adapterFactory(async () => {
      const error = new Error('provider unavailable') as Error & { code: string };
      error.code = 'HTTP_RETRYABLE';
      throw error;
    });
    const cachedBundle = forecastBundle('cached-source');
    const cache = lkgStore({
      runId: 'rain-run:lkg',
      providerConfigId: 'cached-provider',
      freshnessSeconds: 900,
      staleAfterUtc: '2026-09-17T03:30:00Z',
      distanceKm: 1.8,
      bundle: cachedBundle,
    });
    const orchestrator = new RainfallOrchestrator(store, factory, cache, policy, () => 1000);

    await expect(orchestrator.fetch(request)).resolves.toMatchObject({
      providerConfigId: 'cached-provider',
      freshnessSeconds: 900,
      fallbackUsed: true,
      lastKnownGoodUsed: true,
      bundle: cachedBundle,
    });
    expect(cache.findNearestLastKnownGood).toHaveBeenCalledWith({
      capability: 'rainfall.forecast',
      coordinate: { latitude: 19.51, longitude: 105.51 },
      atUtc: '2026-09-17T04:00:00Z',
      maxDistanceKm: 25,
      staleGraceSeconds: 3600,
    });
  });

  it('returns a bounded error when live providers fail and no compatible LKG exists', async () => {
    const store = runtimeStore([provider('preferred', 100)]);
    const factory = adapterFactory(async () => {
      throw new Error('unclassified provider failure');
    });
    const cache = lkgStore(null);
    const orchestrator = new RainfallOrchestrator(store, factory, cache, policy, () => 1000);

    await expect(orchestrator.fetch(request)).rejects.toMatchObject({
      code: 'NO_PROVIDER_AVAILABLE',
    });
    expect(store.recordHealthEvent).toHaveBeenCalledWith(
      'preferred',
      'DEGRADED',
      0,
      'PROVIDER_FAILURE',
    );
  });
});
