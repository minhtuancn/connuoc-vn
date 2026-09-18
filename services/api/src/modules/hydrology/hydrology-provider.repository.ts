import type { Coordinate } from '@connuoc/shared-types';

import type {
  WeatherProviderRepository,
  WeatherProviderRuntimeStore,
  WeatherRuntimeProvider,
} from '../weather/weather-provider.repository.js';

const HYDROLOGY_CAPABILITIES = new Set([
  'hydrology.dischargeForecast',
  'hydrology.dischargeEnsemble',
  'hydrology.retrospective',
  'hydrology.returnPeriods',
]);

export type HydrologyRuntimeProvider = WeatherRuntimeProvider;

export interface HydrologyProviderRuntimeStore
  extends WeatherProviderRuntimeStore {
  listRuntimeProviders(
    coordinate: Coordinate,
  ): Promise<readonly HydrologyRuntimeProvider[]>;
}

export class HydrologyProviderRepository
  implements HydrologyProviderRuntimeStore
{
  constructor(
    private readonly providerRepository: WeatherProviderRepository,
  ) {}

  async listRuntimeProviders(
    coordinate: Coordinate,
  ): Promise<readonly HydrologyRuntimeProvider[]> {
    const providers =
      await this.providerRepository.listRuntimeProviders(coordinate);
    return providers.filter((provider) =>
      provider.selectable.capabilities.some((capability) =>
        HYDROLOGY_CAPABILITIES.has(capability),
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
