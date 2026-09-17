import type {
  ProviderCapability,
  RainfallRecord,
} from '@connuoc/shared-types';

import type { WeatherHydrologyProviderAdapter } from './contracts.js';

export type RainfallProviderCapability = Extract<
  ProviderCapability,
  | 'rainfall.observed'
  | 'rainfall.satellite'
  | 'rainfall.radar'
  | 'rainfall.forecast'
>;

export interface RainfallAdapterRequest {
  readonly capability: RainfallProviderCapability;
  readonly latitude: number;
  readonly longitude: number;
  readonly startUtc?: string;
  readonly endUtc?: string;
  readonly hours?: number;
}

export interface RainfallObjectReference {
  readonly uri: string;
  readonly checksumSha256: string | null;
  readonly mediaType: string | null;
}

export interface NormalizedRainfallBundle {
  readonly capability: RainfallProviderCapability;
  readonly records: readonly RainfallRecord[];
  readonly objectReferences?: readonly RainfallObjectReference[];
}

export interface RainfallProviderAdapter extends WeatherHydrologyProviderAdapter {
  fetchRainfall(
    request: RainfallAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedRainfallBundle>;
}
