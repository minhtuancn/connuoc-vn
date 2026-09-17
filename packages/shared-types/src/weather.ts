import { z } from 'zod';

import { IsoInstantSchema, TimeZoneSchema } from './common.js';

const PercentageSchema = z.number().finite().min(0).max(100);
const TemperatureCelsiusSchema = z.number().finite().min(-100).max(70);
const PressureHpaSchema = z.number().finite().min(300).max(1200);
const WindSpeedMsSchema = z.number().finite().min(0).max(200);
const WindDirectionDegSchema = z.number().finite().min(0).max(360);
const VisibilityMetersSchema = z.number().finite().min(0).max(100_000);
const PrecipitationMmSchema = z.number().finite().min(0).max(5_000);
const WeatherCodeSchema = z.number().int().min(0).max(99);

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }, 'Expected a valid Gregorian date');

export const WeatherFreshnessStateSchema = z.enum(['FRESH', 'STALE']);
export type WeatherFreshnessState = z.infer<typeof WeatherFreshnessStateSchema>;

export const WeatherFreshnessSchema = z
  .object({
    state: WeatherFreshnessStateSchema,
    staleAfter: IsoInstantSchema,
  })
  .strict();
export type WeatherFreshness = z.infer<typeof WeatherFreshnessSchema>;

export const WeatherGridLocationSchema = z
  .object({
    spatialRepresentation: z.literal('GRID_CELL'),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    timeZone: TimeZoneSchema,
    distanceFromRequestKm: z.number().finite().min(0).max(20_000).nullable(),
  })
  .strict();
export type WeatherGridLocation = z.infer<typeof WeatherGridLocationSchema>;

export const WeatherSourceProvenanceSchema = z
  .object({
    sourceId: z.string().trim().min(1).max(160),
    attributionText: z.string().trim().min(1).max(500),
    attributionUrl: z.string().url().max(2048).nullable(),
    modelId: z.string().trim().min(1).max(160),
    modelRunAt: IsoInstantSchema.nullable(),
    fetchedAt: IsoInstantSchema,
  })
  .strict();
export type WeatherSourceProvenance = z.infer<typeof WeatherSourceProvenanceSchema>;

const InstantMetricShape = {
  temperatureC: TemperatureCelsiusSchema,
  apparentTemperatureC: TemperatureCelsiusSchema.nullable(),
  relativeHumidityPct: PercentageSchema,
  pressureHpa: PressureHpaSchema,
  windSpeedMs: WindSpeedMsSchema,
  windGustMs: WindSpeedMsSchema.nullable(),
  windDirectionDeg: WindDirectionDegSchema,
  cloudCoverPct: PercentageSchema.nullable(),
  weatherCode: WeatherCodeSchema,
  visibilityM: VisibilityMetersSchema.nullable(),
  precipitationMm: PrecipitationMmSchema.nullable(),
  rainMm: PrecipitationMmSchema.nullable(),
} as const;

export const CurrentWeatherRecordSchema = z
  .object({
    kind: z.literal('MODEL_CURRENT'),
    validAt: IsoInstantSchema,
    ...InstantMetricShape,
  })
  .strict();
export type CurrentWeatherRecord = z.infer<typeof CurrentWeatherRecordSchema>;

export const HourlyWeatherPointSchema = z
  .object({
    kind: z.literal('FORECAST'),
    validAt: IsoInstantSchema,
    ...InstantMetricShape,
    precipitationProbabilityPct: PercentageSchema.nullable(),
  })
  .strict();
export type HourlyWeatherPoint = z.infer<typeof HourlyWeatherPointSchema>;

export const DailyWeatherPointSchema = z
  .object({
    kind: z.literal('FORECAST'),
    validDate: DateOnlySchema,
    temperatureMinC: TemperatureCelsiusSchema,
    temperatureMaxC: TemperatureCelsiusSchema,
    weatherCode: WeatherCodeSchema,
    precipitationProbabilityMaxPct: PercentageSchema.nullable(),
    precipitationMm: PrecipitationMmSchema.nullable(),
    rainMm: PrecipitationMmSchema.nullable(),
    windSpeedMaxMs: WindSpeedMsSchema.nullable(),
    windGustMaxMs: WindSpeedMsSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.temperatureMinC > value.temperatureMaxC) {
      context.addIssue({
        code: 'custom',
        path: ['temperatureMaxC'],
        message: 'temperatureMaxC must be greater than or equal to temperatureMinC',
      });
    }
  });
export type DailyWeatherPoint = z.infer<typeof DailyWeatherPointSchema>;

const WeatherResponseMetaShape = {
  freshness: WeatherFreshnessSchema,
  grid: WeatherGridLocationSchema,
  source: WeatherSourceProvenanceSchema,
  fallbackUsed: z.boolean(),
} as const;

export const CurrentWeatherResponseSchema = z
  .object({
    ...WeatherResponseMetaShape,
    data: CurrentWeatherRecordSchema,
  })
  .strict();
export type CurrentWeatherResponse = z.infer<typeof CurrentWeatherResponseSchema>;

export const HourlyWeatherResponseSchema = z
  .object({
    ...WeatherResponseMetaShape,
    points: z.array(HourlyWeatherPointSchema).min(1).max(168),
  })
  .strict();
export type HourlyWeatherResponse = z.infer<typeof HourlyWeatherResponseSchema>;

export const DailyWeatherResponseSchema = z
  .object({
    ...WeatherResponseMetaShape,
    points: z.array(DailyWeatherPointSchema).min(1).max(15),
  })
  .strict();
export type DailyWeatherResponse = z.infer<typeof DailyWeatherResponseSchema>;
