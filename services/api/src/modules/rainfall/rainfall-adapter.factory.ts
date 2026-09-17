import {
  FetchWeatherHttpClient,
  FixtureRainfallAdapter,
  OpenMeteoRainfallAdapter,
  type RainfallProviderAdapter,
  type WeatherHttpClient,
} from '@connuoc/weather-worker';

import type { RainfallRuntimeProvider } from './rainfall-provider.repository.js';
import type { WeatherSecretResolver } from '../weather/weather-secret.resolver.js';

export type RainfallAdapterFactoryErrorCode = 'UNSUPPORTED_PROVIDER_TYPE';

export class RainfallAdapterFactoryError extends Error {
  readonly code: RainfallAdapterFactoryErrorCode;

  constructor(code: RainfallAdapterFactoryErrorCode) {
    super('Rainfall provider type is not supported.');
    this.name = 'RainfallAdapterFactoryError';
    this.code = code;
  }
}

export interface RainfallAdapterFactoryPort {
  create(provider: RainfallRuntimeProvider): Promise<RainfallProviderAdapter>;
}

export class RainfallAdapterFactory implements RainfallAdapterFactoryPort {
  constructor(
    private readonly secretResolver: WeatherSecretResolver,
    private readonly httpClient: WeatherHttpClient = new FetchWeatherHttpClient(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(provider: RainfallRuntimeProvider): Promise<RainfallProviderAdapter> {
    const context = {
      providerId: provider.providerId,
      providerKey: provider.providerKey,
      capabilities: provider.selectable.capabilities,
      secretRef: provider.secretRef,
    };

    if (provider.providerType === 'fixture') {
      return new FixtureRainfallAdapter({
        context,
        sourceId: provider.sourceRegistryId,
        attributionText: provider.attribution.text,
        attributionUrl: provider.attribution.url,
        stationId: `fixture:${provider.providerKey}:rainfall`,
        now: this.now,
      });
    }

    if (provider.providerType === 'open-meteo') {
      const apiKey = await this.secretResolver.resolve(provider.secretRef);
      const modelId = provider.modelAllowList[0];
      return new OpenMeteoRainfallAdapter({
        context,
        httpClient: this.httpClient,
        baseUrl: provider.endpointConfig.baseUrl ?? 'https://api.open-meteo.com/v1/forecast',
        sourceId: provider.sourceRegistryId,
        attributionText: provider.attribution.text,
        attributionUrl: provider.attribution.url,
        now: this.now,
        ...(apiKey === null ? {} : { apiKey }),
        ...(modelId === undefined ? {} : { modelId }),
      });
    }

    throw new RainfallAdapterFactoryError('UNSUPPORTED_PROVIDER_TYPE');
  }
}
