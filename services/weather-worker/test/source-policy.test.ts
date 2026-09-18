import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  canRedistributeRaw,
  evaluateSourcePolicy,
  isDeploymentAllowed,
  type SourceUsePolicy,
} from '../src/source-policy.js';

const allowedPolicy: SourceUsePolicy = {
  commercialUseStatus: 'ALLOWED',
  redistributionStatus: 'ATTRIBUTION_REQUIRED',
  rawPayloadRetention: 'ALLOWED_WITH_ATTRIBUTION',
};

describe('source licence policy', () => {
  it.each(['RESTRICTED', 'UNKNOWN'] as const)(
    'blocks %s commercial-use status in COMMERCIAL deployment',
    (commercialUseStatus) => {
      const policy = { ...allowedPolicy, commercialUseStatus };
      expect(isDeploymentAllowed(policy, 'COMMERCIAL')).toBe(false);
      expect(evaluateSourcePolicy(policy, 'COMMERCIAL').rejectionCodes).toContain(
        'COMMERCIAL_USE_BLOCKED',
      );
    },
  );

  it('allows a non-commercial deployment when only commercial use is restricted', () => {
    const policy = { ...allowedPolicy, commercialUseStatus: 'RESTRICTED' as const };
    expect(isDeploymentAllowed(policy, 'NON_COMMERCIAL')).toBe(true);
  });

  it.each(['RESTRICTED', 'UNKNOWN'] as const)(
    'prevents raw republishing when redistribution is %s',
    (redistributionStatus) => {
      const policy = { ...allowedPolicy, redistributionStatus };
      expect(canRedistributeRaw(policy)).toBe(false);
      expect(evaluateSourcePolicy(policy, 'NON_COMMERCIAL').rejectionCodes).toContain(
        'REDISTRIBUTION_BLOCKED',
      );
    },
  );

  it.each(['REFERENCE_ONLY', 'APPROVAL_REQUIRED', 'UNKNOWN'] as const)(
    'prevents raw republishing when retention policy is %s',
    (rawPayloadRetention) => {
      expect(canRedistributeRaw({ ...allowedPolicy, rawPayloadRetention })).toBe(false);
    },
  );

  it('allows attribution-aware redistribution when both policy dimensions permit it', () => {
    expect(canRedistributeRaw(allowedPolicy)).toBe(true);
    expect(evaluateSourcePolicy(allowedPolicy, 'COMMERCIAL')).toEqual({
      deploymentAllowed: true,
      rawRedistributionAllowed: true,
      rejectionCodes: [],
    });
  });
});

describe('Phase 5 provider source registry', () => {
  const registry = JSON.parse(
    readFileSync(new URL('../../../data/sources/registry.json', import.meta.url), 'utf8'),
  ) as {
    schemaVersion: number;
    reviewedAt: string;
    sources: Array<Record<string, unknown>>;
  };

  const requiredIds = [
    'open-meteo-free-hosted',
    'open-meteo-paid-hosted',
    'open-meteo-self-hosted',
    'geoglows-ecmwf-streamflow',
    'nasa-gpm-imerg',
    'vn-nchmf-weather-hydrology-candidate',
  ];

  it('uses the Phase 5 machine-policy registry version', () => {
    expect(registry.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(registry.reviewedAt).toBe('2026-09-18');
  });

  it('contains all reviewed Phase 5 provider candidates with explicit rights fields', () => {
    for (const id of requiredIds) {
      const source = registry.sources.find((candidate) => candidate.id === id);
      expect(source, `missing source ${id}`).toBeDefined();
      expect(source).toMatchObject({ policyVersion: 1 });
      expect(source?.termsReviewedAt).toEqual(expect.any(String));
      expect(source?.termsReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(String(source?.termsReviewedAt) <= registry.reviewedAt).toBe(true);
      expect(source?.licenseStatus).toEqual(expect.any(String));
      expect(source?.commercialUseStatus).toMatch(/^(ALLOWED|RESTRICTED|UNKNOWN)$/);
      expect(source?.redistribution).toMatch(
        /^(ALLOWED|RESTRICTED|ATTRIBUTION_REQUIRED|UNKNOWN)$/,
      );
      expect(source?.rawPayloadRetention).toMatch(
        /^(ALLOWED|ALLOWED_WITH_ATTRIBUTION|REFERENCE_ONLY|APPROVAL_REQUIRED|UNKNOWN)$/,
      );
      expect(source?.attribution).toEqual(expect.any(String));
      expect(source?.termsReference).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(source?.notes).toEqual(expect.any(String));
    }
  });

  it('keeps the Vietnamese official candidate approval-gated until machine-use rights are documented', () => {
    const source = registry.sources.find(
      (candidate) => candidate.id === 'vn-nchmf-weather-hydrology-candidate',
    );
    expect(source).toMatchObject({
      licenseStatus: 'APPROVAL_REQUIRED',
      commercialUseStatus: 'UNKNOWN',
      redistribution: 'UNKNOWN',
      rawPayloadRetention: 'APPROVAL_REQUIRED',
    });
  });
});
