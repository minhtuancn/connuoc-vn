import {
  FetchWeatherHttpClient,
  FixtureHydrologyAdapter,
  GeoglowsHydrologyAdapter,
  OpenMeteoFloodHydrologyAdapter,
  type HydrologyProviderAdapter,
  type WeatherHttpClient,
} from '@connuoc/weather-worker';

import type { WeatherSecretResolver } from '../weather/weather-secret.resolver.js';
import type { HydrologyRuntimeProvider } from './hydrology-provider.repository.js';

export type HydrologyAdapterFactoryErrorCode =
  'UNSUPPORTED_PROVIDER_TYPE';

export class HydrologyAdapterFactoryError extends Error {
  readonly code: HydrologyAdapterFactoryErrorCode;

  constructor(code: HydrologyAdapterFactoryErrorCode) {
    super('Hydrology provider type is not supported.');
    this.name = 'HydrologyAdapterFactoryError';
    this.code = code;
  }
}

export interface HydrologyAdapterFactoryPort {
  create(
    provider: HydrologyRuntimeProvider,
  ): Promise<HydrologyProviderAdapter>;
}

export class HydrologyAdapterFactory
  implements HydrologyAdapterFactoryPort
{
  constructor(
    private readonly secretResolver: WeatherSecretResolver,
    private readonly httpClient: WeatherHttpClient =
      new FetchWeatherHttpClient(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(
    provider: HydrologyRuntimeProvider,
  ): Promise<HydrologyProviderAdapter> {
    const context = {
      providerId: provider.providerId,
      providerKey: provider.providerKey,
      capabilities: provider.selectable.capabilities,
      secretRef: provider.secretRef,
    };

    if (provider.providerType === 'fixture') {
      return new FixtureHydrologyAdapter({
        context,
        sourceId: provider.sourceRegistryId,
        attributionText: provider.attribution.text,
        attributionUrl: provider.attribution.url,
        now: this.now,
      });
    }

    if (provider.providerType === 'geoglows') {
      return new GeoglowsHydrologyAdapter({
        context,
        httpClient: this.httpClient,
        baseUrl:
          provider.endpointConfig.baseUrl ??
          'https://geoglows.ecmwf.int/api/',
        sourceId: provider.sourceRegistryId,
        attributionText: provider.attribution.text,
        attributionUrl: provider.attribution.url,
        productVersion: provider.modelAllowList[0] ?? '2',
        now: this.now,
      });
    }

    if (
      provider.providerType === 'open-meteo' ||
      provider.providerType === 'open-meteo-flood'
    ) {
      const apiKey = await this.secretResolver.resolve(
        provider.secretRef,
      );
      return new OpenMeteoFloodHydrologyAdapter({
        context,
        httpClient: this.httpClient,
        baseUrl:
          provider.endpointConfig.baseUrl ??
          'https://flood-api.open-meteo.com/v1/flood',
        sourceId: provider.sourceRegistryId,
        attributionText: provider.attribution.text,
        attributionUrl: provider.attribution.url,
        modelId: provider.modelAllowList[0] ?? 'forecast_v4',
        now: this.now,
        ...(apiKey === null ? {} : { apiKey }),
      });
    }

    throw new HydrologyAdapterFactoryError(
      'UNSUPPORTED_PROVIDER_TYPE',
    );
  }
}
