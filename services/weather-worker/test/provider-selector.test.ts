import type { ProviderSelectionRequest } from '@connuoc/shared-types';
import { describe, expect, it } from 'vitest';

import {
  selectProvider,
  type SelectableProviderConfig,
} from '../src/provider-selector.js';

const request: ProviderSelectionRequest = {
  capability: 'weather.hourlyForecast',
  location: { latitude: 20.25, longitude: 106.08 },
  atUtc: '2026-09-17T00:00:00.000Z',
  deploymentUse: 'COMMERCIAL',
};

function config(overrides: Partial<SelectableProviderConfig> = {}): SelectableProviderConfig {
  return {
    providerId: 'provider-a',
    providerKey: 'a-provider',
    enabled: true,
    priority: 100,
    weight: 1,
    capabilities: ['weather.hourlyForecast'],
    coversLocation: true,
    commercialUseStatus: 'ALLOWED',
    healthState: 'HEALTHY',
    healthBlocksSelection: true,
    quotaAvailable: true,
    budgetAvailable: true,
    effectiveFromUtc: null,
    effectiveToUtc: null,
    ...overrides,
  };
}

describe('selectProvider', () => {
  it('rejects disabled and capability-incompatible providers with explicit reasons', () => {
    const result = selectProvider(
      [
        config({ providerId: 'disabled', providerKey: 'disabled', enabled: false }),
        config({
          providerId: 'unsupported',
          providerKey: 'unsupported',
          capabilities: ['rainfall.forecast'],
        }),
      ],
      request,
    );

    expect(result.selectedProviderId).toBeNull();
    expect(result.candidates).toEqual([
      { providerId: 'disabled', accepted: false, rejectionCodes: ['DISABLED'] },
      {
        providerId: 'unsupported',
        accepted: false,
        rejectionCodes: ['CAPABILITY_UNSUPPORTED'],
      },
    ]);
  });

  it('rejects providers outside normalized coverage', () => {
    const result = selectProvider([config({ coversLocation: false })], request);

    expect(result.candidates[0]).toEqual({
      providerId: 'provider-a',
      accepted: false,
      rejectionCodes: ['OUTSIDE_COVERAGE'],
    });
  });

  it.each(['RESTRICTED', 'UNKNOWN'] as const)(
    'rejects %s commercial-use status for commercial deployment',
    (commercialUseStatus) => {
      const result = selectProvider([config({ commercialUseStatus })], request);
      expect(result.candidates[0]?.rejectionCodes).toEqual(['LICENCE_BLOCKED']);
    },
  );

  it('does not apply the commercial licence block to non-commercial deployment', () => {
    const result = selectProvider(
      [config({ commercialUseStatus: 'UNKNOWN' })],
      { ...request, deploymentUse: 'NON_COMMERCIAL' },
    );

    expect(result.selectedProviderId).toBe('provider-a');
  });

  it('reports blocking health, quota and budget reasons independently', () => {
    const result = selectProvider(
      [
        config({
          providerId: 'health',
          providerKey: 'health',
          healthState: 'UNAVAILABLE',
          healthBlocksSelection: true,
        }),
        config({
          providerId: 'quota',
          providerKey: 'quota',
          quotaAvailable: false,
        }),
        config({
          providerId: 'budget',
          providerKey: 'budget',
          budgetAvailable: false,
        }),
      ],
      request,
    );

    expect(result.candidates.map((candidate) => [candidate.providerId, candidate.rejectionCodes])).toEqual([
      ['budget', ['BUDGET_BLOCKED']],
      ['health', ['HEALTH_BLOCKED']],
      ['quota', ['QUOTA_BLOCKED']],
    ]);
  });

  it('rejects providers outside their effective interval', () => {
    const result = selectProvider(
      [
        config({
          providerId: 'future',
          providerKey: 'future',
          effectiveFromUtc: '2026-09-18T00:00:00.000Z',
        }),
        config({
          providerId: 'expired',
          providerKey: 'expired',
          effectiveToUtc: '2026-09-17T00:00:00.000Z',
        }),
      ],
      request,
    );

    expect(result.candidates.every((candidate) => candidate.rejectionCodes.includes('NOT_EFFECTIVE'))).toBe(true);
  });

  it('selects a healthy fallback when a higher-priority provider is rejected', () => {
    const result = selectProvider(
      [
        config({
          providerId: 'primary',
          providerKey: 'primary',
          priority: 200,
          healthState: 'UNAVAILABLE',
        }),
        config({ providerId: 'fallback', providerKey: 'fallback', priority: 100 }),
      ],
      request,
    );

    expect(result.selectedProviderId).toBe('fallback');
    expect(result.candidates.find((candidate) => candidate.providerId === 'primary')).toMatchObject({
      accepted: false,
      rejectionCodes: ['HEALTH_BLOCKED'],
    });
  });

  it('orders accepted providers by priority, weight and provider key deterministically', () => {
    const providers = [
      config({ providerId: 'z', providerKey: 'z-provider', priority: 100, weight: 2 }),
      config({ providerId: 'a', providerKey: 'a-provider', priority: 100, weight: 2 }),
      config({ providerId: 'high', providerKey: 'high-provider', priority: 200, weight: 1 }),
      config({ providerId: 'low-weight', providerKey: 'low-weight', priority: 100, weight: 1 }),
    ];

    const first = selectProvider(providers, request);
    const second = selectProvider([...providers].reverse(), request);

    expect(first.selectedProviderId).toBe('high');
    expect(first.candidates.map((candidate) => candidate.providerId)).toEqual([
      'high',
      'a',
      'z',
      'low-weight',
    ]);
    expect(second).toEqual(first);
    expect(JSON.stringify(first)).not.toMatch(/secretRef|apiKey|token|password|endpoint/i);
  });
});
