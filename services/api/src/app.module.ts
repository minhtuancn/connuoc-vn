import { Module, type DynamicModule } from '@nestjs/common';

import { HealthController } from './modules/health/health.controller.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { PublicDataModule } from './modules/public-data/public-data.module.js';
import { RainfallModule } from './modules/rainfall/rainfall.module.js';
import { WeatherModule } from './modules/weather/weather.module.js';

export interface AppModuleOptions {
  readonly allowMissingDatabase: boolean;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        PublicDataModule.register(options),
        AdminModule.register(options),
        WeatherModule.register(options),
        RainfallModule.register(options),
      ],
      controllers: [HealthController],
    };
  }
}
