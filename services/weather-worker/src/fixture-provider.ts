import type { ProviderCapability } from '@connuoc/shared-types';

import type {
  ProviderContext,
  ProviderProbeResult,
  WeatherHydrologyProviderAdapter,
} from './contracts.js';

export class FixtureProviderAdapter implements WeatherHydrologyProviderAdapter {
  readonly providerType = 'fixture';
  readonly context: ProviderContext;
  private readonly capabilities: ReadonlySet<ProviderCapability>;

  constructor(context: ProviderContext) {
    this.context = {
      ...context,
      capabilities: [...context.capabilities],
    };
    this.capabilities = new Set(context.capabilities);
  }

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.has(capability);
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult> {
    signal?.throwIfAborted();
    return {
      state: 'HEALTHY',
      latencyMs: 0,
      providerId: this.context.providerId,
      providerKey: this.context.providerKey,
      details: { fixture: true },
    };
  }
}
