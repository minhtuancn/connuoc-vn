import { describe, expect, it, vi } from 'vitest';

import {
  EnvironmentWeatherSecretResolver,
} from '../src/modules/weather/weather-secret.resolver.js';
import {
  WeatherAdapterFactory,
  type WeatherAdapterFactoryPort,
} from '../src/modules/weather/weather-adapter.factory.js';
import { WeatherOrchestrator } from '../src/modules/weather/weather-orchestrator.js';
import type {
  WeatherProviderRuntimeStore,
  WeatherRuntimeProvider,
} from '../src/modules/weather/weather-provider.repository.js';

function provider(
  providerId: string,
  priority: number,
  overrides: Partial<WeatherRuntimeProvider> = {},
): WeatherRuntimeProvider {
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
    selectable: {
      providerId,
      providerKey: `${providerId}-key`,
      enabled: true,
      priority,
      weight: 1,
      capabilities: ['weather.current'],
      coversLocation: true,
      commercialUseStatus: 'ALLOWED',
      healthState: 'HEALTHY',
      healthBlocksSelection: false,
      quotaAvailable: true,
      budgetAvailable: true,
      effectiveFromUtc: null,
      effectiveToUtc: null,
    },
    ...overrides,
  };
}

function currentBundle(sourceId: string) {
  return {
    capability: 'weather.current' as const,
    grid: {
      spatialRepresentation: 'GRID_CELL' as const,
      latitude: 19.5,
      longitude: 105.5,
      timeZone: 'UTC',
      distanceFromRequestKm: null,
    },
    source: {
      sourceId,
      attributionText: `${sourceId} attribution`,
      attributionUrl: null,
      modelId: 'fixture-model',
      modelRunAt: null,
      fetchedAt: '2026-09-17T04:00:00Z',
    },
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
}

function runtimeStore(providers: readonly WeatherRuntimeProvider[]): WeatherProviderRuntimeStore {
  return {
    listRuntimeProviders: vi.fn(async () => providers),
    recordHealthEvent: vi.fn(async () => undefined),
  };
}

function fixtureFactory(
  behavior: (runtimeProvider: WeatherRuntimeProvider) => Promise<ReturnType<typeof currentBundle>>,
): WeatherAdapterFactoryPort {
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
      fetchWeather: async () => behavior(runtimeProvider),
    })),
  };
}

const request = {
  capability: 'weather.current' as const,
  latitude: 19.51,
  longitude: 105.51,
  atUtc: '2026-09-17T04:00:00Z',
  deploymentUse: 'COMMERCIAL' as const,
};

describe('weather provider orchestration', () => {
  it('uses the preferred accepted provider without marking fallback', async () => {
    const store = runtimeStore([provider('preferred', 100), provider('backup', 90)]);
    const factory = fixtureFactory(async (runtimeProvider) => currentBundle(runtimeProvider.sourceRegistryId));
    const orchestrator = new WeatherOrchestrator(store, factory, () => 1000);

    await expect(orchestrator.fetch(request)).resolves.toMatchObject({
      providerConfigId: 'preferred',
      freshnessSeconds: 900,
      fallbackUsed: false,
      bundle: { source: { sourceId: 'preferred-source' } },
    });
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  it('skips a policy-blocked preferred provider and marks fallback', async () => {
    const blocked = provider('blocked', 200, {
      selectable: {
        ...provider('blocked', 200).selectable,
        commercialUseStatus: 'RESTRICTED',
      },
    });
    const store = runtimeStore([blocked, provider('allowed', 100)]);
    const factory = fixtureFactory(async (runtimeProvider) => currentBundle(runtimeProvider.sourceRegistryId));
    const orchestrator = new WeatherOrchestrator(store, factory, () => 1000);

    const result = await orchestrator.fetch(request);
    expect(result.providerConfigId).toBe('allowed');
    expect(result.fallbackUsed).toBe(true);
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  it('falls back after a retryable preferred-provider fetch failure and records bounded health evidence', async () => {
    const store = runtimeStore([provider('preferred', 100), provider('backup', 90)]);
    const factory = fixtureFactory(async (runtimeProvider) => {
      if (runtimeProvider.providerId === 'preferred') {
        const error = new Error('retryable upstream failure') as Error & {
          code: string;
          retryable: boolean;
        };
        error.code = 'HTTP_RETRYABLE';
        error.retryable = true;
        throw error;
      }
      return currentBundle(runtimeProvider.sourceRegistryId);
    });
    const orchestrator = new WeatherOrchestrator(store, factory, () => 1000);

    const result = await orchestrator.fetch(request);
    expect(result.providerConfigId).toBe('backup');
    expect(result.fallbackUsed).toBe(true);
    expect(store.recordHealthEvent).toHaveBeenCalledWith(
      'preferred',
      'DEGRADED',
      0,
      'HTTP_RETRYABLE',
    );
  });

  it('falls back when an Open-Meteo provider uses an unsupported secret reference', async () => {
    const badSecret = provider('paid-open-meteo', 200, {
      providerType: 'open-meteo',
      endpointConfig: { baseUrl: 'https://customer-api.open-meteo.com/v1/forecast' },
      secretRef: 'vault://weather/open-meteo',
      attribution: { text: 'Open-Meteo', url: 'https://open-meteo.com/' },
    });
    const backup = provider('fixture-backup', 100);
    const store = runtimeStore([badSecret, backup]);
    const factory = new WeatherAdapterFactory(
      new EnvironmentWeatherSecretResolver({}),
      { getJson: vi.fn(async () => ({})) },
      () => new Date('2026-09-17T04:00:00Z'),
    );
    const orchestrator = new WeatherOrchestrator(store, factory, () => 1000);

    const result = await orchestrator.fetch(request);
    expect(result.providerConfigId).toBe('fixture-backup');
    expect(result.fallbackUsed).toBe(true);
    expect(store.recordHealthEvent).toHaveBeenCalledWith(
      'paid-open-meteo',
      'DEGRADED',
      0,
      'SECRET_UNAVAILABLE',
    );
  });

  it('honors coverage and health rejections before attempting adapters', async () => {
    const outside = provider('outside', 300, {
      selectable: { ...provider('outside', 300).selectable, coversLocation: false },
    });
    const unhealthy = provider('unhealthy', 200, {
      selectable: {
        ...provider('unhealthy', 200).selectable,
        healthState: 'DEGRADED',
        healthBlocksSelection: true,
      },
    });
    const healthy = provider('healthy', 100);
    const store = runtimeStore([outside, unhealthy, healthy]);
    const factory = fixtureFactory(async (runtimeProvider) => currentBundle(runtimeProvider.sourceRegistryId));
    const orchestrator = new WeatherOrchestrator(store, factory, () => 1000);

    const result = await orchestrator.fetch(request);
    expect(result.providerConfigId).toBe('healthy');
    expect(result.fallbackUsed).toBe(true);
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  it('returns a bounded orchestration error when no provider is eligible', async () => {
    const store = runtimeStore([
      provider('disabled', 100, {
        selectable: { ...provider('disabled', 100).selectable, enabled: false },
      }),
    ]);
    const orchestrator = new WeatherOrchestrator(
      store,
      fixtureFactory(async (runtimeProvider) => currentBundle(runtimeProvider.sourceRegistryId)),
      () => 1000,
    );

    await expect(orchestrator.fetch(request)).rejects.toMatchObject({
      code: 'NO_PROVIDER_AVAILABLE',
    });
  });
});
