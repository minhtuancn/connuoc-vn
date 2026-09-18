import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseModule, PG_POOL } from '../../database/database.module.js';
import { WeatherProviderRepository } from '../weather/weather-provider.repository.js';
import { EnvironmentWeatherSecretResolver } from '../weather/weather-secret.resolver.js';
import { RainfallAdapterFactory } from './rainfall-adapter.factory.js';
import { RainfallController } from './rainfall.controller.js';
import { RainfallOrchestrator } from './rainfall-orchestrator.js';
import { RainfallProviderRepository } from './rainfall-provider.repository.js';
import { RainfallRepository } from './rainfall.repository.js';
import { RainfallService } from './rainfall.service.js';

export interface RainfallModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class RainfallModule {
  static register(options: RainfallModuleOptions): DynamicModule {
    return {
      module: RainfallModule,
      imports: [DatabaseModule.register(options)],
      controllers: [RainfallController],
      providers: [
        {
          provide: RainfallRepository,
          useFactory: (pool: Pool | null) => new RainfallRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: RainfallProviderRepository,
          useFactory: (pool: Pool | null) =>
            new RainfallProviderRepository(new WeatherProviderRepository(pool)),
          inject: [PG_POOL],
        },
        {
          provide: RainfallAdapterFactory,
          useFactory: () =>
            new RainfallAdapterFactory(new EnvironmentWeatherSecretResolver()),
        },
        {
          provide: RainfallOrchestrator,
          useFactory: (
            providerRepository: RainfallProviderRepository,
            factory: RainfallAdapterFactory,
            repository: RainfallRepository,
          ) =>
            new RainfallOrchestrator(
              providerRepository,
              factory,
              repository,
              {
                lkgMaxDistanceKm: 25,
                lkgStaleGraceSeconds: 21_600,
              },
            ),
          inject: [
            RainfallProviderRepository,
            RainfallAdapterFactory,
            RainfallRepository,
          ],
        },
        {
          provide: RainfallService,
          useFactory: (
            orchestrator: RainfallOrchestrator,
            repository: RainfallRepository,
          ) => new RainfallService(orchestrator, repository),
          inject: [RainfallOrchestrator, RainfallRepository],
        },
      ],
      exports: [RainfallService],
    };
  }
}
