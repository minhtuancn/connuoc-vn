import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Inject,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { WeatherService, WeatherUnavailableError } from './weather.service.js';

const CoordinateQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lon: z.coerce.number().finite().min(-180).max(180),
  })
  .strict();

const HourlyQuerySchema = CoordinateQuerySchema.extend({
  hours: z.coerce.number().int().min(1).max(168),
}).strict();

const DailyQuerySchema = CoordinateQuerySchema.extend({
  days: z.coerce.number().int().min(1).max(15),
}).strict();

function validationDetail(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join('; ');
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    statusCode: 503,
    code: 'WEATHER_UNAVAILABLE',
    message: 'Weather data is temporarily unavailable.',
  });
}

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(@Inject(WeatherService) private readonly service: WeatherService) {}

  @Get('current')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  @ApiOperation({ summary: 'Get normalized current model weather for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async current(@Query() rawQuery: unknown) {
    const parsed = CoordinateQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    try {
      return await this.service.getCurrent({
        latitude: parsed.data.lat,
        longitude: parsed.data.lon,
      });
    } catch (error) {
      if (error instanceof WeatherUnavailableError) throw unavailable();
      throw error;
    }
  }

  @Get('hourly')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get normalized hourly weather forecast for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'hours', required: true, type: Number, minimum: 1, maximum: 168 })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async hourly(@Query() rawQuery: unknown) {
    const parsed = HourlyQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    try {
      return await this.service.getHourly(
        { latitude: parsed.data.lat, longitude: parsed.data.lon },
        parsed.data.hours,
      );
    } catch (error) {
      if (error instanceof WeatherUnavailableError) throw unavailable();
      throw error;
    }
  }

  @Get('daily')
  @Header('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800')
  @ApiOperation({ summary: 'Get normalized daily weather forecast for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'days', required: true, type: Number, minimum: 1, maximum: 15 })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async daily(@Query() rawQuery: unknown) {
    const parsed = DailyQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    try {
      return await this.service.getDaily(
        { latitude: parsed.data.lat, longitude: parsed.data.lon },
        parsed.data.days,
      );
    } catch (error) {
      if (error instanceof WeatherUnavailableError) throw unavailable();
      throw error;
    }
  }
}
