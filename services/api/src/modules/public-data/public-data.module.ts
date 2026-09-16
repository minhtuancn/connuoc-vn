import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseModule, PG_POOL } from '../../database/database.module.js';
import { LocationModule } from '../locations/location.module.js';
import { PublicDataController } from './public-data.controller.js';
import { PgPublicDataRepository } from './public-data.repository.js';
import { PublicDataService } from './public-data.service.js';
import type { PublicDataRepository } from './public-data.types.js';

const PUBLIC_DATA_REPOSITORY = Symbol('PUBLIC_DATA_REPOSITORY');

export interface PublicDataModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class PublicDataModule {
  static register(options: PublicDataModuleOptions): DynamicModule {
    return {
      module: PublicDataModule,
      imports: [DatabaseModule.register(options), LocationModule.register(options)],
      controllers: [PublicDataController],
      providers: [
        {
          provide: PUBLIC_DATA_REPOSITORY,
          useFactory: (pool: Pool | null): PublicDataRepository => new PgPublicDataRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: PublicDataService,
          useFactory: (repository: PublicDataRepository) => new PublicDataService(repository),
          inject: [PUBLIC_DATA_REPOSITORY],
        },
      ],
    };
  }
}
