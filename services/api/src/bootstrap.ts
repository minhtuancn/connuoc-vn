import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { parseApiEnvironment, type ApiEnvironment } from './config/env.js';
import { buildOpenApiDocument } from './openapi.js';

export async function createApiApp(
  environment: ApiEnvironment = parseApiEnvironment(),
): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: environment.NODE_ENV === 'test' ? false : { level: environment.LOG_LEVEL },
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();

  const openApi = buildOpenApiDocument(app);
  SwaggerModule.setup('docs', app, openApi, { useGlobalPrefix: true });

  return app;
}
