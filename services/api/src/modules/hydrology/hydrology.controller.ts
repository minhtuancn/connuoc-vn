import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Query,
  ServiceUnavailableException,
  UseFilters,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';

import {
  HydrologyService,
  HydrologyUnavailableError,
  RiverReachNotFoundError,
} from './hydrology.service.js';

const NearbyQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lon: z.coerce.number().finite().min(-180).max(180),
    radiusKm: z.coerce.number().finite().positive().max(500),
    limit: z.coerce.number().int().min(1).max(100),
  })
  .strict();

const ForecastQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(30),
  })
  .strict();

const ReachParamSchema = z.string().trim().min(1).max(240);

function validationDetail(error: z.ZodError): string {
  return error.issues
    .map(
      (issue) =>
        `${issue.path.join('.') || 'request'}: ${issue.message}`,
    )
    .join('; ');
}

class HydrologyUnavailableHttpException extends ServiceUnavailableException {
  constructor() {
    super({
      statusCode: 503,
      code: 'HYDROLOGY_UNAVAILABLE',
      message: 'Hydrology data is temporarily unavailable.',
    });
  }
}

@Catch(HydrologyUnavailableHttpException)
class HydrologyUnavailableExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: HydrologyUnavailableHttpException,
    host: ArgumentsHost,
  ): void {
    const reply =
      host.switchToHttp().getResponse<FastifyReply>();
    reply
      .status(503)
      .type('application/json')
      .send(exception.getResponse());
  }
}

@ApiTags('rivers')
@UseFilters(HydrologyUnavailableExceptionFilter)
@Controller('rivers')
export class HydrologyController {
  constructor(
    @Inject(HydrologyService)
    private readonly service: HydrologyService,
  ) {}

  @Get('nearby')
  @Header(
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=600',
  )
  @ApiOperation({
    summary:
      'List nearby normalized river reaches with mapping uncertainty',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({
    name: 'radiusKm',
    required: true,
    type: Number,
    minimum: 0,
    maximum: 500,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiOkResponse({
    schema: { type: 'object', additionalProperties: true },
  })
  async nearby(@Query() rawQuery: unknown) {
    const parsed = NearbyQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      throw new BadRequestException(
        validationDetail(parsed.error),
      );
    }

    try {
      return await this.service.getNearby(
        parsed.data.lat,
        parsed.data.lon,
        parsed.data.radiusKm,
        parsed.data.limit,
      );
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':reachId/forecast')
  @Header(
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=600',
  )
  @ApiOperation({
    summary:
      'Get normalized discharge forecast and return-period context for a river reach',
  })
  @ApiParam({
    name: 'reachId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'days',
    required: true,
    type: Number,
    minimum: 1,
    maximum: 30,
  })
  @ApiOkResponse({
    schema: { type: 'object', additionalProperties: true },
  })
  async forecast(
    @Param('reachId') rawReachId: string,
    @Query() rawQuery: unknown,
  ) {
    const reachId = ReachParamSchema.safeParse(rawReachId);
    const query = ForecastQuerySchema.safeParse(rawQuery);
    if (!reachId.success) {
      throw new BadRequestException(
        validationDetail(reachId.error),
      );
    }
    if (!query.success) {
      throw new BadRequestException(
        validationDetail(query.error),
      );
    }

    try {
      return await this.service.getForecast(
        reachId.data,
        query.data.days,
      );
    } catch (error) {
      if (error instanceof HydrologyUnavailableError) {
        throw new HydrologyUnavailableHttpException();
      }
      if (error instanceof RiverReachNotFoundError) {
        throw new NotFoundException({
          statusCode: 404,
          code: error.code,
          message: error.message,
        });
      }
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
