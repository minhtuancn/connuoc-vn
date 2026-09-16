import { z } from 'zod';

import { CoordinateSchema, IsoInstantSchema } from './common.js';

export const ProviderCapabilitySchema = z.enum([
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
]);
export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;

export const CommercialUseStatusSchema = z.enum(['ALLOWED', 'RESTRICTED', 'UNKNOWN']);
export type CommercialUseStatus = z.infer<typeof CommercialUseStatusSchema>;

export const RedistributionStatusSchema = z.enum([
  'ALLOWED',
  'RESTRICTED',
  'ATTRIBUTION_REQUIRED',
  'UNKNOWN',
]);
export type RedistributionStatus = z.infer<typeof RedistributionStatusSchema>;

export const ProviderHealthStateSchema = z.enum([
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN',
]);
export type ProviderHealthState = z.infer<typeof ProviderHealthStateSchema>;

export const DeploymentUseSchema = z.enum(['NON_COMMERCIAL', 'COMMERCIAL']);
export type DeploymentUse = z.infer<typeof DeploymentUseSchema>;

export const ProviderSelectionRequestSchema = z
  .object({
    capability: ProviderCapabilitySchema,
    location: CoordinateSchema,
    atUtc: IsoInstantSchema,
    deploymentUse: DeploymentUseSchema,
  })
  .strict();
export type ProviderSelectionRequest = z.infer<typeof ProviderSelectionRequestSchema>;
