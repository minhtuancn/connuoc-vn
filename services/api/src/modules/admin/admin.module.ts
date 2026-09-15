import { Module, type DynamicModule } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseModule, PG_POOL } from '../../database/database.module.js';
import { PgAdminAuthRepository } from './admin-auth.repository.js';
import { AdminController } from './admin.controller.js';
import { AdminAuthGuard, AdminCapabilityGuard } from './admin.guards.js';
import { PgAdminRepository } from './admin.repository.js';

export interface AdminModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class AdminModule {
  static register(options: AdminModuleOptions): DynamicModule {
    return {
      module: AdminModule,
      imports: [DatabaseModule.register(options)],
      controllers: [AdminController],
      providers: [
        {
          provide: PgAdminAuthRepository,
          useFactory: (pool: Pool | null) => new PgAdminAuthRepository(pool),
          inject: [PG_POOL],
        },
        {
          provide: PgAdminRepository,
          useFactory: (pool: Pool | null) => new PgAdminRepository(pool),
          inject: [PG_POOL],
        },
        AdminAuthGuard,
        AdminCapabilityGuard,
      ],
    };
  }
}
