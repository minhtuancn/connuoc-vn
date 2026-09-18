import type {
  DeploymentUse,
  RiverReachResolution,
} from '@connuoc/shared-types';
import {
  selectProvider,
  type HydrologyProviderCapability,
  type HydrologySeriesCapability,
  type NormalizedHydrologyBundle,
  type NormalizedHydrologyReturnPeriodBundle,
} from '@connuoc/weather-worker';

import type { HydrologyAdapterFactoryPort } from './hydrology-adapter.factory.js';
import type {
  HydrologyProviderRuntimeStore,
  HydrologyRuntimeProvider,
} from './hydrology-provider.repository.js';

export interface HydrologyReachResolutionStore {
  findProviderResolution(query: {
    readonly riverReachPublicId: string;
    readonly providerConfigId: string;
    readonly atUtc: string;
  }): Promise<RiverReachResolution | null>;
}

export type HydrologyNormalizedBundle =
  | NormalizedHydrologyBundle
  | NormalizedHydrologyReturnPeriodBundle;

export interface HydrologyLastKnownGoodQuery {
  readonly riverReachPublicId: string;
  readonly capability: HydrologyProviderCapability;
  readonly atUtc: string;
  readonly staleGraceSeconds: number;
}

export interface HydrologyLastKnownGoodResult {
  readonly runId: string;
  readonly providerConfigId: string;
  readonly providerReachId: string;
  readonly freshnessSeconds: number;
  readonly staleAfterUtc: string;
  readonly mapping: RiverReachResolution;
  readonly bundle: HydrologyNormalizedBundle;
}

export interface HydrologyLastKnownGoodStore {
  findLastKnownGood(
    query: HydrologyLastKnownGoodQuery,
  ): Promise<HydrologyLastKnownGoodResult | null>;
}

export interface HydrologyOrchestrationPolicy {
  readonly lkgStaleGraceSeconds: number;
}

export interface HydrologyOrchestrationRequest {
  readonly capability: HydrologyProviderCapability;
  readonly riverReachId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly atUtc: string;
  readonly modelRunAtUtc?: string;
  readonly days?: number;
  readonly startUtc?: string;
  readonly endUtc?: string;
  readonly deploymentUse: DeploymentUse;
}

export interface HydrologyOrchestrationResult {
  readonly providerConfigId: string;
  readonly providerReachId: string;
  readonly freshnessSeconds: number;
  readonly fallbackUsed: boolean;
  readonly lastKnownGoodUsed: boolean;
  readonly mapping: RiverReachResolution;
  readonly bundle: HydrologyNormalizedBundle;
}

export type HydrologyOrchestrationErrorCode =
  | 'NO_PROVIDER_AVAILABLE'
  | 'INVALID_REQUEST';

export class HydrologyOrchestrationError extends Error {
  readonly code: HydrologyOrchestrationErrorCode;

  constructor(code: HydrologyOrchestrationErrorCode) {
    super(
      code === 'INVALID_REQUEST'
        ? 'Hydrology request is invalid.'
        : 'No hydrology provider is currently available.',
    );
    this.name = 'HydrologyOrchestrationError';
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
    if (
      typeof value === 'string' &&
      BOUNDED_FAILURE_CODES.has(value)
    ) {
      return value;
    }
  }
  if (error instanceof RangeError) return 'INVALID_REQUEST';
  if (error instanceof TypeError) return 'INVALID_PAYLOAD';
  return 'PROVIDER_FAILURE';
}

function assertPolicy(policy: HydrologyOrchestrationPolicy): void {
  if (
    !Number.isInteger(policy.lkgStaleGraceSeconds) ||
    policy.lkgStaleGraceSeconds < 0 ||
    policy.lkgStaleGraceSeconds > 31_536_000
  ) {
    throw new RangeError(
      'lkgStaleGraceSeconds must be an integer between 0 and 31536000',
    );
  }
}

function assertRequest(request: HydrologyOrchestrationRequest): void {
  if (
    request.riverReachId.trim().length === 0 ||
    !Number.isFinite(Date.parse(request.atUtc)) ||
    !Number.isFinite(request.latitude) ||
    request.latitude < -90 ||
    request.latitude > 90 ||
    !Number.isFinite(request.longitude) ||
    request.longitude < -180 ||
    request.longitude > 180
  ) {
    throw new HydrologyOrchestrationError('INVALID_REQUEST');
  }
}

export class HydrologyOrchestrator {
  constructor(
    private readonly store: HydrologyProviderRuntimeStore,
    private readonly factory: HydrologyAdapterFactoryPort,
    private readonly reachStore: HydrologyReachResolutionStore,
    private readonly lastKnownGoodStore: HydrologyLastKnownGoodStore,
    private readonly policy: HydrologyOrchestrationPolicy,
    private readonly clockMs: () => number = () => Date.now(),
  ) {
    assertPolicy(policy);
  }

  async fetch(
    request: HydrologyOrchestrationRequest,
  ): Promise<HydrologyOrchestrationResult> {
    assertRequest(request);

    const providers = await this.store.listRuntimeProviders({
      latitude: request.latitude,
      longitude: request.longitude,
    });
    const providersById = new Map(
      providers.map((provider) => [provider.providerId, provider]),
    );
    const selection = selectProvider(
      providers.map((provider) => provider.selectable),
      {
        capability: request.capability,
        location: {
          latitude: request.latitude,
          longitude: request.longitude,
        },
        atUtc: request.atUtc,
        deploymentUse: request.deploymentUse,
      },
    );

    for (const [candidateIndex, decision] of selection.candidates.entries()) {
      if (!decision.accepted) continue;
      const provider = providersById.get(decision.providerId);
      if (!provider) continue;

      const mapping = await this.reachStore.findProviderResolution({
        riverReachPublicId: request.riverReachId,
        providerConfigId: provider.providerId,
        atUtc: request.atUtc,
      });
      if (
        mapping?.state !== 'MAPPED' ||
        mapping.selectedProviderReachId === null
      ) {
        continue;
      }

      const startedAt = this.clockMs();
      try {
        const adapter = await this.factory.create(provider);
        const bundle = await this.fetchFromAdapter(
          adapter,
          request,
          mapping.selectedProviderReachId,
        );
        await this.recordHealthSafely(
          provider,
          'HEALTHY',
          this.elapsed(startedAt),
          null,
        );

        return {
          providerConfigId: provider.providerId,
          providerReachId: mapping.selectedProviderReachId,
          freshnessSeconds: provider.freshnessSeconds,
          fallbackUsed: candidateIndex > 0,
          lastKnownGoodUsed: false,
          mapping,
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
          throw new HydrologyOrchestrationError('INVALID_REQUEST');
        }
      }
    }

    const cached = await this.lastKnownGoodStore.findLastKnownGood({
      riverReachPublicId: request.riverReachId,
      capability: request.capability,
      atUtc: request.atUtc,
      staleGraceSeconds: this.policy.lkgStaleGraceSeconds,
    });
    if (cached) {
      return {
        providerConfigId: cached.providerConfigId,
        providerReachId: cached.providerReachId,
        freshnessSeconds: cached.freshnessSeconds,
        fallbackUsed: true,
        lastKnownGoodUsed: true,
        mapping: cached.mapping,
        bundle: cached.bundle,
      };
    }

    throw new HydrologyOrchestrationError('NO_PROVIDER_AVAILABLE');
  }

  private async fetchFromAdapter(
    adapter: Awaited<
      ReturnType<HydrologyAdapterFactoryPort['create']>
    >,
    request: HydrologyOrchestrationRequest,
    providerReachId: string,
  ): Promise<HydrologyNormalizedBundle> {
    if (request.capability === 'hydrology.returnPeriods') {
      return adapter.fetchReturnPeriods({
        riverReachId: request.riverReachId,
        providerReachId,
      });
    }

    return adapter.fetchHydrology({
      capability: request.capability as HydrologySeriesCapability,
      riverReachId: request.riverReachId,
      providerReachId,
      latitude: request.latitude,
      longitude: request.longitude,
      ...(request.modelRunAtUtc === undefined
        ? {}
        : { modelRunAtUtc: request.modelRunAtUtc }),
      ...(request.days === undefined ? {} : { days: request.days }),
      ...(request.startUtc === undefined
        ? {}
        : { startUtc: request.startUtc }),
      ...(request.endUtc === undefined
        ? {}
        : { endUtc: request.endUtc }),
    });
  }

  private elapsed(startedAt: number): number {
    return Math.max(0, Math.round(this.clockMs() - startedAt));
  }

  private async recordHealthSafely(
    provider: HydrologyRuntimeProvider,
    state: 'HEALTHY' | 'DEGRADED',
    latencyMs: number,
    code: string | null,
  ): Promise<void> {
    try {
      await this.store.recordHealthEvent(
        provider.providerId,
        state,
        latencyMs,
        code,
      );
    } catch {
      // Health telemetry must never change provider fallback semantics.
    }
  }
}
