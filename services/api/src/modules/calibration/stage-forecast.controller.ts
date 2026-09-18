import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';

import {
  HydrologyUnavailableError,
  RiverReachNotFoundError,
} from '../hydrology/hydrology.service.js';
import { StageForecastService } from './stage-forecast.service.js';

const IdSchema = z.string().trim().min(1).max(240);
const ForecastQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(30),
  })
  .strict();

function validationDetail(error: z.ZodError): string {
  return error.issues
    .map(
      (issue) =>
        `${issue.path.join('.') || 'request'}: ${issue.message}`,
    )
    .join('; ');
}

function rethrowHydrology(error: unknown): never {
  if (error instanceof HydrologyUnavailableError) {
    throw new ServiceUnavailableException({
      statusCode: 503,
      code: 'HYDROLOGY_UNAVAILABLE',
      message: 'Hydrology data is temporarily unavailable.',
    });
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

@ApiTags('rivers')
@Controller('rivers')
export class StageForecastController {
  constructor(
    @Inject(StageForecastService)
    private readonly service: StageForecastService,
  ) {}

  @Get(':reachId/stage-forecast')
  @ApiOperation({
    summary:
      'Get evidence-gated derived river stage forecast with discharge context',
  })
  @ApiParam({ name: 'reachId', required: true, type: String })
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
    const reachId = IdSchema.safeParse(rawReachId);
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
      rethrowHydrology(error);
    }
  }
}

@ApiTags('hydrology-calibration')
@Controller('hydrology/stations')
export class StationCalibrationController {
  constructor(
    @Inject(StageForecastService)
    private readonly service: StageForecastService,
  ) {}

  @Get(':stationId/calibration')
  @ApiOperation({
    summary:
      'Get active stage calibration evidence for a gauge station',
  })
  @ApiParam({
    name: 'stationId',
    required: true,
    type: String,
  })
  @ApiOkResponse({
    schema: { type: 'object', additionalProperties: true },
  })
  async calibration(
    @Param('stationId') rawStationId: string,
  ) {
    const stationId = IdSchema.safeParse(rawStationId);
    if (!stationId.success) {
      throw new BadRequestException(
        validationDetail(stationId.error),
      );
    }

    try {
      return await this.service.getStationCalibration(
        stationId.data,
      );
    } catch (error) {
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
