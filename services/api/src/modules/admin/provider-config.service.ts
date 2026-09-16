import type { AdminMutationContext } from './admin.repository.js';
import type { PgProviderConfigRepository } from './provider-config.repository.js';
import type { ProviderConfigWrite, ProviderStatusPatch } from './provider-config.types.js';

export type ProviderConfigPolicyErrorCode = 'LICENCE_BLOCKED';

export class ProviderConfigPolicyError extends Error {
  override readonly name = 'ProviderConfigPolicyError';

  constructor(
    readonly code: ProviderConfigPolicyErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class ProviderConfigService {
  constructor(private readonly repository: PgProviderConfigRepository) {}

  list(): Promise<readonly Record<string, unknown>[]> {
    return this.repository.listProviders();
  }

  get(providerKey: string): Promise<Record<string, unknown> | null> {
    return this.repository.getProvider(providerKey);
  }

  put(
    providerKey: string,
    input: ProviderConfigWrite,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    if (input.enabled && input.commercialUseStatus !== 'ALLOWED') {
      throw new ProviderConfigPolicyError(
        'LICENCE_BLOCKED',
        `Provider '${providerKey}' cannot be enabled for commercial deployment while commercial-use status is ${input.commercialUseStatus}.`,
      );
    }
    return this.repository.putProvider(providerKey, input, context);
  }

  async patchStatus(
    providerKey: string,
    patch: ProviderStatusPatch,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    if (patch.enabled === true) {
      const existing = await this.repository.getProvider(providerKey);
      if (existing && existing.commercialUseStatus !== 'ALLOWED') {
        throw new ProviderConfigPolicyError(
          'LICENCE_BLOCKED',
          `Provider '${providerKey}' cannot be enabled for commercial deployment while commercial-use status is ${String(existing.commercialUseStatus)}.`,
        );
      }
    }
    return this.repository.patchStatus(providerKey, patch, context);
  }
}
