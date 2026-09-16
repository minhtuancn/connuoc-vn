import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';

import { LocationService } from '../locations/location.service.js';
import { PublicDataService } from './public-data.service.js';
import { PublicDataError } from './public-data.types.js';

const StationIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'Invalid station identifier');

const SearchQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(160),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).optional(),
    scope: z.enum(['stations', 'administrative']).default('stations'),
    effectiveAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((value, context) => {
    if (value.scope === 'administrative' && value.limit > 50) {
      context.addIssue({
        code: 'custom',
        path: ['limit'],
        message: 'administrative search limit must not exceed 50',
      });
    }
    if (value.scope === 'administrative' && value.cursor !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['cursor'],
        message: 'cursor is not supported for administrative search',
      });
    }
    if (value.scope === 'stations' && value.effectiveAt !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveAt'],
        message: 'effectiveAt is only supported for administrative search',
      });
    }
  });

const InstantSchema = z.string().datetime({ offset: true });

const TideQuerySchema = z
  .object({
    start: InstantSchema,
    end: InstantSchema,
    intervalSeconds: z.coerce.number().int().min(60).max(3600).default(900),
  })
  .superRefine((value, context) => {
    const start = Date.parse(value.start);
    const end = Date.parse(value.end);
    if (end < start) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'end must be at or after start' });
      return;
    }
    if (end - start > 7 * 24 * 60 * 60 * 1000) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'tide horizon must not exceed 7 days' });
    }
  });

const WaterLevelQuerySchema = z
  .object({
    start: InstantSchema.optional(),
    end: InstantSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (!value.start || !value.end) return;
    const start = Date.parse(value.start);
    const end = Date.parse(value.end);
    if (end < start) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'end must be at or after start' });
      return;
    }
    if (end - start > 31 * 24 * 60 * 60 * 1000) {
      context.addIssue({ code: 'custom', path: ['end'], message: 'water-level range must not exceed 31 days' });
    }
  });

const CalendarQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD'),
});

function validationDetail(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    const result = z.object({ offset: z.number().int().min(0) }).safeParse(parsed);
    if (!result.success) throw new Error('invalid cursor shape');
    return result.data.offset;
  } catch {
    throw new BadRequestException('cursor is invalid or malformed');
  }
}

function parseStationId(value: string): string {
  const result = StationIdSchema.safeParse(value);
  if (!result.success) throw new BadRequestException(validationDetail(result.error));
  return result.data;
}

function parseCalendarDate(value: string, fieldName: string): Date {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException(`${fieldName} does not exist in the Gregorian calendar`);
  }
  return date;
}

function toSolarDate(value: string): { year: number; month: number; day: number } {
  const date = parseCalendarDate(value, 'date');
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function vietnamToday(): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function translatePublicDataError(error: unknown): never {
  if (!(error instanceof PublicDataError)) throw error;
  switch (error.code) {
    case 'STATION_NOT_FOUND':
    case 'TIDE_MODEL_NOT_FOUND':
      throw new NotFoundException(error.message);
    case 'INVALID_TIDE_MODEL':
      throw new UnprocessableEntityException(error.message);
    case 'DATABASE_UNAVAILABLE':
      throw new ServiceUnavailableException(error.message);
  }
}

function setCache(reply: FastifyReply, value: string): void {
  reply.header('Cache-Control', value);
}

@ApiTags('public-data')
@Controller()
export class PublicDataController {
  constructor(
    @Inject(PublicDataService) private readonly service: PublicDataService,
    @Inject(LocationService) private readonly locationService: LocationService,
  ) {}

  @Get('locations/search')
  @ApiOperation({ summary: 'Search public stations or versioned administrative areas' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'scope', required: false, enum: ['stations', 'administrative'] })
  @ApiQuery({ name: 'effectiveAt', required: false, type: String, example: '2026-09-17' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async searchLocations(@Query() rawQuery: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const parsed = SearchQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));
    setCache(reply, 'public, max-age=300, stale-while-revalidate=600');

    if (parsed.data.scope === 'administrative') {
      const effectiveAtText = parsed.data.effectiveAt ?? vietnamToday();
      const effectiveAt = parseCalendarDate(effectiveAtText, 'effectiveAt');
      const items = await this.locationService.search({
        query: parsed.data.q,
        effectiveAt,
        limit: parsed.data.limit,
      });
      return {
        items,
        meta: {
          scope: 'administrative',
          effectiveAt: effectiveAtText,
        },
      };
    }

    try {
      return await this.service.searchLocations(parsed.data.q, {
        limit: parsed.data.limit,
        offset: decodeCursor(parsed.data.cursor),
      });
    } catch (error) {
      translatePublicDataError(error);
    }
  }

  @Get('stations/:id')
  @ApiOperation({ summary: 'Get public station metadata with latest provenance' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async getStation(@Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply) {
    setCache(reply, 'public, max-age=300, stale-while-revalidate=600');
    try {
      return await this.service.getStation(parseStationId(id));
    } catch (error) {
      translatePublicDataError(error);
    }
  }

  @Get('stations/:id/tide')
  @ApiOperation({ summary: 'Predict deterministic harmonic tide levels for a station' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  @ApiQuery({ name: 'intervalSeconds', required: false, type: Number })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async getTide(
    @Param('id') id: string,
    @Query() rawQuery: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const parsed = TideQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));
    setCache(reply, 'public, max-age=300, stale-while-revalidate=900');
    try {
      return await this.service.getTide(parseStationId(id), {
        startUtc: parsed.data.start,
        endUtc: parsed.data.end,
        intervalSeconds: parsed.data.intervalSeconds,
      });
    } catch (error) {
      translatePublicDataError(error);
    }
  }

  @Get('stations/:id/water-level')
  @ApiOperation({ summary: 'Get normalized observed water levels with provenance' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async getWaterLevels(
    @Param('id') id: string,
    @Query() rawQuery: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const parsed = WaterLevelQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));
    setCache(reply, 'public, max-age=60, stale-while-revalidate=120');
    try {
      return await this.service.getWaterLevels(parseStationId(id), {
        startUtc: parsed.data.start ?? null,
        endUtc: parsed.data.end ?? null,
        limit: parsed.data.limit,
        offset: decodeCursor(parsed.data.cursor),
      });
    } catch (error) {
      translatePublicDataError(error);
    }
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Convert a Gregorian date to the Vietnamese lunar calendar' })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2024-02-10' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  getCalendar(@Query() rawQuery: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const parsed = CalendarQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));
    setCache(reply, 'public, max-age=300, stale-while-revalidate=600');
    return this.service.getCalendar(toSolarDate(parsed.data.date));
  }
}
