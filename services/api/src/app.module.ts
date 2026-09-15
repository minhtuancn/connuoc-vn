import { Module, type DynamicModule } from '@nestjs/common';

import { HealthController } from './modules/health/health.controller.js';
import { PublicDataModule } from './modules/public-data/public-data.module.js';

export interface AppModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [PublicDataModule.register(options)],
      controllers: [HealthController],
    };
  }
}
