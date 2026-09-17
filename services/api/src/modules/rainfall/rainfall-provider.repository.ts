import type { Coordinate } from '@connuoc/shared-types';

import {
  WeatherProviderRepository,
  type WeatherProviderRuntimeStore,
  type WeatherRuntimeProvider,
} from '../weather/weather-provider.repository.js';

const RAINFALL_CAPABILITIES = new Set([
  'rainfall.observed',
  'rainfall.satellite',
  'rainfall.radar',
  'rainfall.forecast',
]);

export type RainfallRuntimeProvider = WeatherRuntimeProvider;

export interface RainfallProviderRuntimeStore extends WeatherProviderRuntimeStore {
  listRuntimeProviders(coordinate: Coordinate): Promise<readonly RainfallRuntimeProvider[]>;
}

export class RainfallProviderRepository implements RainfallProviderRuntimeStore {
  constructor(private readonly providerRepository: WeatherProviderRepository) {}

  async listRuntimeProviders(
    coordinate: Coordinate,
  ): Promise<readonly RainfallRuntimeProvider[]> {
    const providers = await this.providerRepository.listRuntimeProviders(coordinate);
    return providers.filter((provider) =>
      provider.selectable.capabilities.some((capability) =>
        RAINFALL_CAPABILITIES.has(capability),
      ),
    );
  }

  async recordHealthEvent(
    providerId: string,
    state: Parameters<WeatherProviderRuntimeStore['recordHealthEvent']>[1],
    latencyMs: number,
    failureCode: string | null,
  ): Promise<void> {
    await this.providerRepository.recordHealthEvent(
      providerId,
      state,
      latencyMs,
      failureCode,
    );
  }
}
