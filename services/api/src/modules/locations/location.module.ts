import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseModule, PG_POOL } from '../../database/database.module.js';
import { LocationController } from './location.controller.js';
import { LocationRepository } from './location.repository.js';
import { LocationService } from './location.service.js';

const LOCATION_REPOSITORY = Symbol('LOCATION_REPOSITORY');

export interface LocationModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class LocationModule {
  static register(options: LocationModuleOptions): DynamicModule {
    return {
      module: LocationModule,
      imports: [DatabaseModule.register(options)],
      controllers: [LocationController],
      providers: [
        {
          provide: LOCATION_REPOSITORY,
          useFactory: (pool: Pool | null) => new LocationRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: LocationService,
          useFactory: (repository: LocationRepository) => new LocationService(repository),
          inject: [LOCATION_REPOSITORY],
        },
      ],
      exports: [LocationService],
    };
  }
}
