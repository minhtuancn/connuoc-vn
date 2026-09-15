import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function buildOpenApiDocument(app: NestFastifyApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Con Nước Việt API')
    .setDescription('Public and administrative API for tide, water-level, calendar and provenance data.')
    .setVersion('1.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}
