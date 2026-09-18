import type { DeploymentUse } from '@connuoc/shared-types';
import {
  selectProvider,
  type NormalizedRainfallBundle,
  type RainfallAdapterRequest,
  type RainfallProviderCapability,
} from '@connuoc/weather-worker';

import type { RainfallAdapterFactoryPort } from './rainfall-adapter.factory.js';
import type {
  RainfallProviderRuntimeStore,
  RainfallRuntimeProvider,
} from './rainfall-provider.repository.js';

export interface RainfallLastKnownGoodQuery {
  readonly capability: RainfallProviderCapability;
  readonly coordinate: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly atUtc: string;
  readonly maxDistanceKm: number;
  readonly staleGraceSeconds: number;
}

export interface RainfallLastKnownGoodResult {
  readonly runId: string;
  readonly providerConfigId: string;
  readonly freshnessSeconds: number;
  readonly staleAfterUtc: string;
  readonly distanceKm: number;
  readonly bundle: NormalizedRainfallBundle;
}

export interface RainfallLastKnownGoodStore {
  findNearestLastKnownGood(
    query: RainfallLastKnownGoodQuery,
  ): Promise<RainfallLastKnownGoodResult | null>;
}

export interface RainfallOrchestrationPolicy {
  readonly lkgMaxDistanceKm: number;
  readonly lkgStaleGraceSeconds: number;
}

export interface RainfallOrchestrationRequest extends RainfallAdapterRequest {
  readonly capability: RainfallProviderCapability;
  readonly atUtc: string;
  readonly deploymentUse: DeploymentUse;
}

export interface RainfallOrchestrationResult {
  readonly providerConfigId: string;
  readonly freshnessSeconds: number;
  readonly fallbackUsed: boolean;
  readonly lastKnownGoodUsed: boolean;
  readonly bundle: NormalizedRainfallBundle;
}

export type RainfallOrchestrationErrorCode =
  | 'NO_PROVIDER_AVAILABLE'
  | 'INVALID_REQUEST';

export class RainfallOrchestrationError extends Error {
  readonly code: RainfallOrchestrationErrorCode;

  constructor(code: RainfallOrchestrationErrorCode) {
    super(
      code === 'INVALID_REQUEST'
        ? 'Rainfall request is invalid.'
        : 'No rainfall provider is currently available.',
    );
    this.name = 'RainfallOrchestrationError';
    this.code = code;
  }
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

function assertPolicy(policy: RainfallOrchestrationPolicy): void {
  if (
    !Number.isFinite(policy.lkgMaxDistanceKm) ||
    policy.lkgMaxDistanceKm <= 0 ||
    policy.lkgMaxDistanceKm > 500
  ) {
    throw new RangeError('lkgMaxDistanceKm must be between 0 and 500');
  }
  if (
    !Number.isInteger(policy.lkgStaleGraceSeconds) ||
    policy.lkgStaleGraceSeconds < 0 ||
    policy.lkgStaleGraceSeconds > 31_536_000
  ) {
    throw new RangeError('lkgStaleGraceSeconds must be an integer between 0 and 31536000');
  }
}

export class RainfallOrchestrator {
  constructor(
    private readonly store: RainfallProviderRuntimeStore,
    private readonly factory: RainfallAdapterFactoryPort,
    private readonly lastKnownGoodStore: RainfallLastKnownGoodStore,
    private readonly policy: RainfallOrchestrationPolicy,
    private readonly clockMs: () => number = () => Date.now(),
  ) {
    assertPolicy(policy);
  }

  async fetch(
    request: RainfallOrchestrationRequest,
  ): Promise<RainfallOrchestrationResult> {
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
        const bundle = await adapter.fetchRainfall(this.adapterRequest(request));
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
          lastKnownGoodUsed: false,
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
        if (code === 'INVALID_REQUEST') {
          throw new RainfallOrchestrationError('INVALID_REQUEST');
        }
      }
    }

    const cached = await this.lastKnownGoodStore.findNearestLastKnownGood({
      capability: request.capability,
      coordinate: { latitude: request.latitude, longitude: request.longitude },
      atUtc: request.atUtc,
      maxDistanceKm: this.policy.lkgMaxDistanceKm,
      staleGraceSeconds: this.policy.lkgStaleGraceSeconds,
    });
    if (cached) {
      return {
        providerConfigId: cached.providerConfigId,
        freshnessSeconds: cached.freshnessSeconds,
        fallbackUsed: true,
        lastKnownGoodUsed: true,
        bundle: cached.bundle,
      };
    }

    throw new RainfallOrchestrationError('NO_PROVIDER_AVAILABLE');
  }

  private adapterRequest(
    request: RainfallOrchestrationRequest,
  ): RainfallAdapterRequest {
    return {
      capability: request.capability,
      latitude: request.latitude,
      longitude: request.longitude,
      ...(request.startUtc === undefined ? {} : { startUtc: request.startUtc }),
      ...(request.endUtc === undefined ? {} : { endUtc: request.endUtc }),
      ...(request.hours === undefined ? {} : { hours: request.hours }),
    };
  }

  private elapsed(startedAt: number): number {
    return Math.max(0, Math.round(this.clockMs() - startedAt));
  }

  private async recordHealthSafely(
    provider: RainfallRuntimeProvider,
    state: 'HEALTHY' | 'DEGRADED',
    latencyMs: number,
    code: string | null,
  ): Promise<void> {
    try {
      await this.store.recordHealthEvent(provider.providerId, state, latencyMs, code);
    } catch {
      // Health telemetry must never change fallback semantics.
    }
  }
}
