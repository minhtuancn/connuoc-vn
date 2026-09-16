import type { ProviderCapability, ProviderHealthState } from '@connuoc/shared-types';

export interface ProviderContext {
  readonly providerId: string;
  readonly providerKey: string;
  readonly capabilities: readonly ProviderCapability[];
  readonly secretRef: string | null;
}

export interface ProviderProbeResult {
  readonly state: ProviderHealthState;
  readonly latencyMs: number;
  readonly providerId: string;
  readonly providerKey: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface WeatherHydrologyProviderAdapter {
  readonly providerType: string;
  readonly context: ProviderContext;

  supports(capability: ProviderCapability): boolean;
  healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult>;
}
