import {
  FetchWeatherHttpClient,
  FixtureProviderAdapter,
  OpenMeteoWeatherAdapter,
  type WeatherForecastAdapter,
  type WeatherHttpClient,
} from '@connuoc/weather-worker';

import type { WeatherRuntimeProvider } from './weather-provider.repository.js';
import type { WeatherSecretResolver } from './weather-secret.resolver.js';

export type WeatherAdapterFactoryErrorCode = 'UNSUPPORTED_PROVIDER_TYPE';

export class WeatherAdapterFactoryError extends Error {
  readonly code: WeatherAdapterFactoryErrorCode;

  constructor(code: WeatherAdapterFactoryErrorCode) {
    super('Weather provider type is not supported.');
    this.name = 'WeatherAdapterFactoryError';
    this.code = code;
  }
}

export interface WeatherAdapterFactoryPort {
  create(provider: WeatherRuntimeProvider): Promise<WeatherForecastAdapter>;
}

export class WeatherAdapterFactory implements WeatherAdapterFactoryPort {
  constructor(
    private readonly secretResolver: WeatherSecretResolver,
    private readonly httpClient: WeatherHttpClient = new FetchWeatherHttpClient(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(provider: WeatherRuntimeProvider): Promise<WeatherForecastAdapter> {
    const context = {
      providerId: provider.providerId,
      providerKey: provider.providerKey,
      capabilities: provider.selectable.capabilities,
      secretRef: provider.secretRef,
    };

    if (provider.providerType === 'fixture') {
      return new FixtureProviderAdapter(context);
    }

    if (provider.providerType === 'open-meteo') {
      const apiKey = await this.secretResolver.resolve(provider.secretRef);
      const modelId = provider.modelAllowList[0];
      return new OpenMeteoWeatherAdapter({
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

    throw new WeatherAdapterFactoryError('UNSUPPORTED_PROVIDER_TYPE');
  }
}
