import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { LocationService } from './location.service.js';

const ResolveQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    effectiveAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

function validationDetail(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');
}

function parseCalendarDate(value: string): Date {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new BadRequestException('effectiveAt does not exist in the Gregorian calendar');
  }
  return parsed;
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

@ApiTags('locations')
@Controller()
export class LocationController {
  constructor(@Inject(LocationService) private readonly service: LocationService) {}

  @Get('locations/resolve')
  @ApiOperation({ summary: 'Resolve a WGS84 point to the versioned Vietnam administrative hierarchy' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lon', required: true, type: Number })
  @ApiQuery({ name: 'effectiveAt', required: false, type: String, example: '2026-09-17' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async resolve(@Query() rawQuery: unknown) {
    const parsed = ResolveQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(validationDetail(parsed.error));

    const effectiveAtText = parsed.data.effectiveAt ?? vietnamToday();
    const effectiveAt = parseCalendarDate(effectiveAtText);
    const resolved = await this.service.resolvePoint({
      latitude: parsed.data.lat,
      longitude: parsed.data.lon,
      effectiveAt,
    });

    return {
      ...resolved,
      timeZone: resolved.administrativeAreas.length > 0 ? 'Asia/Ho_Chi_Minh' : null,
      effectiveAt: effectiveAtText,
    };
  }
}
