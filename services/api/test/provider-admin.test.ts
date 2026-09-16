import { describe, expect, it, vi } from 'vitest';

import {
  ProviderConfigWriteSchema,
  ProviderStatusPatchSchema,
} from '../src/modules/admin/provider-config.types.js';
import { ProviderConfigService } from '../src/modules/admin/provider-config.service.js';
import type { ProviderConfigPolicyError } from '../src/modules/admin/provider-config.service.js';
import type { PgProviderConfigRepository } from '../src/modules/admin/provider-config.repository.js';

const validWrite = {
  providerType: 'fixture',
  enabled: false,
  priority: 100,
  weight: 1,
  secretRef: 'vault://weather/open-meteo',
  endpointConfig: { baseUrl: 'https://example.test', timeoutMs: 10_000 },
  commercialUseStatus: 'ALLOWED',
  redistributionStatus: 'ATTRIBUTION_REQUIRED',
  licenceStatus: 'REVIEWED',
  attributionText: 'Fixture attribution',
  attributionUrl: 'https://example.test/terms',
  coverageGeoJson: null,
  quotaPolicy: { requestsPerDay: 10_000, blockWhenExhausted: true },
  budgetPolicy: { monthlyUsd: 100, blockWhenExceeded: true },
  freshnessPolicy: { maxAgeSeconds: 3600 },
  modelAllowList: ['fixture-model'],
  fallbackGroup: 'weather-default',
  healthState: 'HEALTHY',
  healthBlocksSelection: true,
  capabilities: ['weather.hourlyForecast'],
  metadata: { reviewed: true },
} as const;

describe('provider admin input policy', () => {
  it.each(['apiKey', 'token', 'password', 'secretValue'])(
    'rejects credential-looking top-level field %s',
    (field) => {
      const parsed = ProviderConfigWriteSchema.safeParse({ ...validWrite, [field]: 'CANARY-SECRET' });
      expect(parsed.success).toBe(false);
    },
  );

  it('rejects credential-looking nested endpoint or metadata fields', () => {
    expect(
      ProviderConfigWriteSchema.safeParse({
        ...validWrite,
        endpointConfig: { baseUrl: 'https://example.test', token: 'CANARY-SECRET' },
      }).success,
    ).toBe(false);
    expect(
      ProviderConfigWriteSchema.safeParse({
        ...validWrite,
        metadata: { password: 'CANARY-SECRET' },
      }).success,
    ).toBe(false);
  });

  it('bounds provider status mutations to operational state only', () => {
    expect(ProviderStatusPatchSchema.parse({ enabled: false })).toEqual({ enabled: false });
    expect(ProviderStatusPatchSchema.safeParse({ priority: 999 }).success).toBe(false);
  });

  it('blocks enabling a provider whose commercial-use policy is not allowed', async () => {
    const repository = {
      putProvider: vi.fn(),
    } as unknown as PgProviderConfigRepository;
    const service = new ProviderConfigService(repository);

    await expect(
      service.put(
        'restricted-provider',
        { ...validWrite, enabled: true, commercialUseStatus: 'RESTRICTED' },
        {
          actor: {
            actorId: 'operator-1',
            displayName: 'Operator',
            role: 'data-operator',
            capabilities: ['admin:read', 'providers:write'],
          },
          correlationId: 'provider-policy-test',
          requestMethod: 'PUT',
          requestPath: '/v1/admin/providers/restricted-provider',
        },
      ),
    ).rejects.toMatchObject<Partial<ProviderConfigPolicyError>>({ code: 'LICENCE_BLOCKED' });
    expect(repository.putProvider).not.toHaveBeenCalled();
  });
});
