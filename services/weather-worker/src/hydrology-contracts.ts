import type {
  HydrologyDischargeRecord,
  HydrologyReturnPeriodRecord,
  ProviderCapability,
  RiverReachResolution,
} from '@connuoc/shared-types';

import type { WeatherHydrologyProviderAdapter } from './contracts.js';

export type HydrologyProviderCapability = Extract<
  ProviderCapability,
  | 'hydrology.dischargeForecast'
  | 'hydrology.dischargeEnsemble'
  | 'hydrology.retrospective'
  | 'hydrology.returnPeriods'
>;

export type HydrologySeriesCapability = Exclude<
  HydrologyProviderCapability,
  'hydrology.returnPeriods'
>;

export interface HydrologyReachLookupRequest {
  readonly latitude: number;
  readonly longitude: number;
}

export interface HydrologyAdapterRequest {
  readonly capability: HydrologySeriesCapability;
  readonly riverReachId: string;
  readonly providerReachId: string;
  readonly days?: number;
  readonly startUtc?: string;
  readonly endUtc?: string;
}

export interface HydrologyReturnPeriodRequest {
  readonly riverReachId: string;
  readonly providerReachId: string;
}

export interface NormalizedHydrologyBundle {
  readonly capability: HydrologySeriesCapability;
  readonly records: readonly HydrologyDischargeRecord[];
}

export interface NormalizedHydrologyReturnPeriodBundle {
  readonly capability: 'hydrology.returnPeriods';
  readonly records: readonly HydrologyReturnPeriodRecord[];
}

export interface HydrologyProviderAdapter extends WeatherHydrologyProviderAdapter {
  resolveReach(
    request: HydrologyReachLookupRequest,
    signal?: AbortSignal,
  ): Promise<RiverReachResolution>;

  fetchHydrology(
    request: HydrologyAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle>;

  fetchReturnPeriods(
    request: HydrologyReturnPeriodRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyReturnPeriodBundle>;
}
