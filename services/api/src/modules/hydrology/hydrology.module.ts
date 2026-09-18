import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import {
  DatabaseModule,
  PG_POOL,
} from '../../database/database.module.js';
import { WeatherProviderRepository } from '../weather/weather-provider.repository.js';
import { EnvironmentWeatherSecretResolver } from '../weather/weather-secret.resolver.js';
import { CalibrationRepository } from '../calibration/calibration.repository.js';
import { StageForecastController, StationCalibrationController } from '../calibration/stage-forecast.controller.js';
import { StageForecastRepository } from '../calibration/stage-forecast.repository.js';
import { StageForecastService } from '../calibration/stage-forecast.service.js';
import { HydrologyAdapterFactory } from './hydrology-adapter.factory.js';
import { HydrologyController } from './hydrology.controller.js';
import { HydrologyOrchestrator } from './hydrology-orchestrator.js';
import { HydrologyProviderRepository } from './hydrology-provider.repository.js';
import { HydrologyRepository } from './hydrology.repository.js';
import { HydrologyService } from './hydrology.service.js';
import { RiverReachRepository } from './river-reach.repository.js';

export interface HydrologyModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class HydrologyModule {
  static register(
    options: HydrologyModuleOptions,
  ): DynamicModule {
    return {
      module: HydrologyModule,
      imports: [DatabaseModule.register(options)],
      controllers: [HydrologyController, StageForecastController, StationCalibrationController],
      providers: [
        {
          provide: RiverReachRepository,
          useFactory: (pool: Pool | null) =>
            new RiverReachRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: HydrologyRepository,
          useFactory: (pool: Pool | null) =>
            new HydrologyRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: CalibrationRepository,
          useFactory: (pool: Pool | null) =>
            new CalibrationRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: StageForecastRepository,
          useFactory: (pool: Pool | null) =>
            new StageForecastRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: HydrologyProviderRepository,
          useFactory: (pool: Pool | null) =>
            new HydrologyProviderRepository(
              new WeatherProviderRepository(pool),
            ),
          inject: [PG_POOL],
        },
        {
          provide: HydrologyAdapterFactory,
          useFactory: () =>
            new HydrologyAdapterFactory(
              new EnvironmentWeatherSecretResolver(),
            ),
        },
        {
          provide: HydrologyOrchestrator,
          useFactory: (
            providerRepository: HydrologyProviderRepository,
            adapterFactory: HydrologyAdapterFactory,
            reachRepository: RiverReachRepository,
            repository: HydrologyRepository,
          ) =>
            new HydrologyOrchestrator(
              providerRepository,
              adapterFactory,
              reachRepository,
              repository,
              {
                lkgStaleGraceSeconds: 21_600,
              },
            ),
          inject: [
            HydrologyProviderRepository,
            HydrologyAdapterFactory,
            RiverReachRepository,
            HydrologyRepository,
          ],
        },
        {
          provide: HydrologyService,
          useFactory: (
            orchestrator: HydrologyOrchestrator,
            repository: HydrologyRepository,
            reachRepository: RiverReachRepository,
          ) =>
            new HydrologyService(
              orchestrator,
              repository,
              reachRepository,
            ),
          inject: [
            HydrologyOrchestrator,
            HydrologyRepository,
            RiverReachRepository,
          ],
        },
        {
          provide: StageForecastService,
          useFactory: (
            hydrologyService: HydrologyService,
            hydrologyRepository: HydrologyRepository,
            calibrationRepository: CalibrationRepository,
            stageRepository: StageForecastRepository,
          ) =>
            new StageForecastService(
              hydrologyService,
              hydrologyRepository,
              calibrationRepository,
              stageRepository,
            ),
          inject: [
            HydrologyService,
            HydrologyRepository,
            CalibrationRepository,
            StageForecastRepository,
          ],
        },
      ],
      exports: [HydrologyService, StageForecastService],
    };
  }
}
