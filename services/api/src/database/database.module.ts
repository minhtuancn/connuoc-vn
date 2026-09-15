import { DynamicModule, Inject, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import type { Pool } from 'pg';

import { parseDatabaseEnvironment } from './config.js';
import { createDatabasePool } from './pool.js';

export const PG_POOL = Symbol('PG_POOL');
const DATABASE_MODULE_OPTIONS = Symbol('DATABASE_MODULE_OPTIONS');

export interface DatabaseModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Injectable()
class DatabasePoolLifecycle implements OnModuleDestroy {
  readonly pool: Pool | null;

  constructor(
    @Inject(DATABASE_MODULE_OPTIONS)
    options: DatabaseModuleOptions,
  ) {
    if (!process.env.DATABASE_URL) {
      if (!options.allowMissingDatabase) {
        throw new Error('DATABASE_URL is required when public database routes are enabled.');
      }
      this.pool = null;
      return;
    }

    this.pool = createDatabasePool(parseDatabaseEnvironment(process.env));
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}

@Module({})
export class DatabaseModule {
  static register(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: DATABASE_MODULE_OPTIONS, useValue: options },
        DatabasePoolLifecycle,
        {
          provide: PG_POOL,
          useFactory: (lifecycle: DatabasePoolLifecycle) => lifecycle.pool,
          inject: [DatabasePoolLifecycle],
        },
      ],
      exports: [PG_POOL],
    };
  }
}
