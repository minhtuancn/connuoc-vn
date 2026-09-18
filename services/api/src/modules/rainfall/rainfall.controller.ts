import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  Header,
  Inject,
  Query,
  ServiceUnavailableException,
  UseFilters,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';

import { IsoInstantSchema } from '@connuoc/shared-types';

import { RainfallService, RainfallUnavailableError } from './rainfall.service.js';

const CoordinateQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lon: z.coerce.number().finite().min(-180).max(180),
  })
  .strict();

const SummaryQuerySchema = CoordinateQuerySchema.extend({
  at: IsoInstantSchema,
}).strict();

const HistoryQuerySchema = CoordinateQuerySchema.extend({
  start: IsoInstantSchema,
  end: IsoInstantSchema,
  limit: z.coerce.number().int().min(1).max(500),
})
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.end) <= Date.parse(value.start)) {
      context.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'end must be later than start',
      });
    }
  });

const ForecastQuerySchema = CoordinateQuerySchema.extend({
  hours: z.coerce.number().int().min(1).max(168),
}).strict();

function validationDetail(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join('; ');
}

class RainfallUnavailableHttpException extends ServiceUnavailableException {
  constructor() {
    super({
      statusCode: 503,
      code: 'RAINFALL_UNAVAILABLE',
      message: 'Rainfall data is temporarily unavailable.',
    });
  }
}

@Catch(RainfallUnavailableHttpException)
class RainfallUnavailableExceptionFilter implements ExceptionFilter {
  catch(exception: RainfallUnavailableHttpException, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    reply.status(503).type('application/json').send(exception.getResponse());
  }
}

function unavailable(): RainfallUnavailableHttpException {
  return new RainfallUnavailableHttpException();
}

@ApiTags('rainfall')
@UseFilters(RainfallUnavailableExceptionFilter)
@Controller('rainfall')
export class RainfallController {
  constructor(@Inject(RainfallService) private readonly service: RainfallService) {}

  @Get('summary')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get normalized rainfall accumulation summary for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'at', required: true, type: String })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async summary(@Query() rawQuery: unknown) {
    const parsed = SummaryQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    return this.service.getSummary(
      { latitude: parsed.data.lat, longitude: parsed.data.lon },
      parsed.data.at,
    );
  }

  @Get('history')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get normalized observed and estimated rainfall history for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  @ApiQuery({ name: 'limit', required: true, type: Number, minimum: 1, maximum: 500 })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async history(@Query() rawQuery: unknown) {
    const parsed = HistoryQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    return this.service.getHistory(
      { latitude: parsed.data.lat, longitude: parsed.data.lon },
      parsed.data.start,
      parsed.data.end,
      parsed.data.limit,
    );
  }

  @Get('forecast')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get normalized rainfall forecast for a WGS84 point' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'hours', required: true, type: Number, minimum: 1, maximum: 168 })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async forecast(@Query() rawQuery: unknown) {
    const parsed = ForecastQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    try {
      return await this.service.getForecast(
        { latitude: parsed.data.lat, longitude: parsed.data.lon },
        parsed.data.hours,
      );
    } catch (error) {
      if (error instanceof RainfallUnavailableError) throw unavailable();
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
