import { describe, expect, it } from 'vitest';

import {
  CommercialUseStatusSchema,
  DeploymentUseSchema,
  ProviderCapabilitySchema,
  ProviderHealthStateSchema,
  ProviderRedistributionStatusSchema,
  ProviderSelectionRequestSchema,
} from '../src/index.ts';

const expectedCapabilities = [
  'weather.current',
  'weather.hourlyForecast',
  'weather.dailyForecast',
  'weather.historical',
  'weather.ensemble',
  'rainfall.observed',
  'rainfall.satellite',
  'rainfall.radar',
  'rainfall.forecast',
  'hydrology.dischargeForecast',
  'hydrology.dischargeEnsemble',
  'hydrology.retrospective',
  'hydrology.returnPeriods',
  'hydrology.stageObservation',
  'hydrology.officialBulletin',
  'hazard.floodBaseline',
  'alert.official',
] as const;

describe('provider contracts', () => {
  it('keeps provider capability strings stable and JSON-safe', () => {
    expect(ProviderCapabilitySchema.options).toEqual(expectedCapabilities);
    expect(JSON.parse(JSON.stringify(expectedCapabilities))).toEqual(expectedCapabilities);
  });

  it('keeps policy and health status strings stable', () => {
    expect(CommercialUseStatusSchema.options).toEqual(['ALLOWED', 'RESTRICTED', 'UNKNOWN']);
    expect(ProviderRedistributionStatusSchema.options).toEqual([
      'ALLOWED',
      'RESTRICTED',
      'ATTRIBUTION_REQUIRED',
      'UNKNOWN',
    ]);
    expect(ProviderHealthStateSchema.options).toEqual([
      'HEALTHY',
      'DEGRADED',
      'UNAVAILABLE',
      'UNKNOWN',
    ]);
    expect(DeploymentUseSchema.options).toEqual(['NON_COMMERCIAL', 'COMMERCIAL']);
  });

  it('validates selection coordinates and UTC/offset timestamp semantics', () => {
    const valid = {
      capability: 'weather.current',
      location: { latitude: 20.08, longitude: 106.18 },
      atUtc: '2026-09-17T00:00:00Z',
      deploymentUse: 'NON_COMMERCIAL',
    } as const;

    expect(ProviderSelectionRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      ProviderSelectionRequestSchema.safeParse({
        ...valid,
        location: { latitude: -91, longitude: 106.18 },
      }).success,
    ).toBe(false);
    expect(
      ProviderSelectionRequestSchema.safeParse({ ...valid, atUtc: '2026-09-17T07:00:00' }).success,
    ).toBe(false);
  });
});
