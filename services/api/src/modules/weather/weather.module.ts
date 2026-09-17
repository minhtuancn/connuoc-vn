import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseModule, PG_POOL } from '../../database/database.module.js';
import { WeatherAdapterFactory } from './weather-adapter.factory.js';
import { WeatherController } from './weather.controller.js';
import { WeatherOrchestrator } from './weather-orchestrator.js';
import { WeatherProviderRepository } from './weather-provider.repository.js';
import { WeatherRepository } from './weather.repository.js';
import { EnvironmentWeatherSecretResolver } from './weather-secret.resolver.js';
import { WeatherService } from './weather.service.js';

const WEATHER_PROVIDER_REPOSITORY = Symbol('WEATHER_PROVIDER_REPOSITORY');
const WEATHER_REPOSITORY = Symbol('WEATHER_REPOSITORY');
const WEATHER_SECRET_RESOLVER = Symbol('WEATHER_SECRET_RESOLVER');
const WEATHER_ADAPTER_FACTORY = Symbol('WEATHER_ADAPTER_FACTORY');

export interface WeatherModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class WeatherModule {
  static register(options: WeatherModuleOptions): DynamicModule {
    return {
      module: WeatherModule,
      imports: [DatabaseModule.register(options)],
      controllers: [WeatherController],
      providers: [
        {
          provide: WEATHER_PROVIDER_REPOSITORY,
          useFactory: (pool: Pool | null) => new WeatherProviderRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: WEATHER_REPOSITORY,
          useFactory: (pool: Pool | null) => new WeatherRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: WEATHER_SECRET_RESOLVER,
          useFactory: () => new EnvironmentWeatherSecretResolver(),
        },
        {
          provide: WEATHER_ADAPTER_FACTORY,
          useFactory: (resolver: EnvironmentWeatherSecretResolver) =>
            new WeatherAdapterFactory(resolver),
          inject: [WEATHER_SECRET_RESOLVER],
        },
        {
          provide: WeatherOrchestrator,
          useFactory: (
            repository: WeatherProviderRepository,
            factory: WeatherAdapterFactory,
          ) => new WeatherOrchestrator(repository, factory),
          inject: [WEATHER_PROVIDER_REPOSITORY, WEATHER_ADAPTER_FACTORY],
        },
        {
          provide: WeatherService,
          useFactory: (orchestrator: WeatherOrchestrator, repository: WeatherRepository) =>
            new WeatherService(orchestrator, repository),
          inject: [WeatherOrchestrator, WEATHER_REPOSITORY],
        },
      ],
      exports: [WeatherService],
    };
  }
}
