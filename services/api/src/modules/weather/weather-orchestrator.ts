import type { DeploymentUse } from '@connuoc/shared-types';
import {
  selectProvider,
  type NormalizedWeatherBundle,
  type WeatherForecastCapability,
  type WeatherForecastRequest,
} from '@connuoc/weather-worker';

import type { WeatherAdapterFactoryPort } from './weather-adapter.factory.js';
import type {
  WeatherProviderRuntimeStore,
  WeatherRuntimeProvider,
} from './weather-provider.repository.js';

export type WeatherOrchestrationErrorCode =
  | 'NO_PROVIDER_AVAILABLE'
  | 'INVALID_REQUEST';

export class WeatherOrchestrationError extends Error {
  readonly code: WeatherOrchestrationErrorCode;

  constructor(code: WeatherOrchestrationErrorCode) {
    super(
      code === 'INVALID_REQUEST'
        ? 'Weather request is invalid.'
        : 'No weather provider is currently available.',
    );
    this.name = 'WeatherOrchestrationError';
    this.code = code;
  }
}

export interface WeatherOrchestrationRequest extends WeatherForecastRequest {
  readonly capability: WeatherForecastCapability;
  readonly atUtc: string;
  readonly deploymentUse: DeploymentUse;
}

export interface WeatherOrchestrationResult {
  readonly providerConfigId: string;
  readonly freshnessSeconds: number;
  readonly fallbackUsed: boolean;
  readonly bundle: NormalizedWeatherBundle;
}

const BOUNDED_FAILURE_CODES = new Set([
  'SECRET_UNAVAILABLE',
  'UNSUPPORTED_PROVIDER_TYPE',
  'INVALID_REQUEST',
  'UNSUPPORTED_CAPABILITY',
  'INVALID_PAYLOAD',
  'HTTP_RETRYABLE',
  'HTTP_REJECTED',
  'NETWORK',
  'PROVIDER_FAILURE',
]);

function failureCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const value = (error as { code?: unknown }).code;
    if (typeof value === 'string' && BOUNDED_FAILURE_CODES.has(value)) return value;
  }
  return 'PROVIDER_FAILURE';
}

function isInvalidRequest(error: unknown): boolean {
  return failureCode(error) === 'INVALID_REQUEST';
}

export class WeatherOrchestrator {
  constructor(
    private readonly store: WeatherProviderRuntimeStore,
    private readonly factory: WeatherAdapterFactoryPort,
    private readonly clockMs: () => number = () => Date.now(),
  ) {}

  async fetch(request: WeatherOrchestrationRequest): Promise<WeatherOrchestrationResult> {
    const providers = await this.store.listRuntimeProviders({
      latitude: request.latitude,
      longitude: request.longitude,
    });
    const providersById = new Map(providers.map((provider) => [provider.providerId, provider]));
    const selection = selectProvider(
      providers.map((provider) => provider.selectable),
      {
        capability: request.capability,
        location: { latitude: request.latitude, longitude: request.longitude },
        atUtc: request.atUtc,
        deploymentUse: request.deploymentUse,
      },
    );

    for (const [candidateIndex, decision] of selection.candidates.entries()) {
      if (!decision.accepted) continue;
      const provider = providersById.get(decision.providerId);
      if (!provider) continue;

      const startedAt = this.clockMs();
      try {
        const adapter = await this.factory.create(provider);
        const bundle = await adapter.fetchWeather(this.forecastRequest(request));
        await this.recordHealthSafely(
          provider,
          'HEALTHY',
          this.elapsed(startedAt),
          null,
        );
        return {
          providerConfigId: provider.providerId,
          freshnessSeconds: provider.freshnessSeconds,
          fallbackUsed: candidateIndex > 0,
          bundle,
        };
      } catch (error) {
        const code = failureCode(error);
        await this.recordHealthSafely(
          provider,
          'DEGRADED',
          this.elapsed(startedAt),
          code,
        );
        if (isInvalidRequest(error)) {
          throw new WeatherOrchestrationError('INVALID_REQUEST');
        }
      }
    }

    throw new WeatherOrchestrationError('NO_PROVIDER_AVAILABLE');
  }

  private forecastRequest(request: WeatherOrchestrationRequest): WeatherForecastRequest {
    if (request.capability === 'weather.hourlyForecast') {
      return {
        capability: request.capability,
        latitude: request.latitude,
        longitude: request.longitude,
        ...(request.hours === undefined ? {} : { hours: request.hours }),
      };
    }
    if (request.capability === 'weather.dailyForecast') {
      return {
        capability: request.capability,
        latitude: request.latitude,
        longitude: request.longitude,
        ...(request.days === undefined ? {} : { days: request.days }),
      };
    }
    return {
      capability: request.capability,
      latitude: request.latitude,
      longitude: request.longitude,
    };
  }

  private elapsed(startedAt: number): number {
    return Math.max(0, Math.round(this.clockMs() - startedAt));
  }

  private async recordHealthSafely(
    provider: WeatherRuntimeProvider,
    state: 'HEALTHY' | 'DEGRADED',
    latencyMs: number,
    code: string | null,
  ): Promise<void> {
    try {
      await this.store.recordHealthEvent(provider.providerId, state, latencyMs, code);
    } catch {
      // Health telemetry must not change provider fallback semantics.
    }
  }
}
