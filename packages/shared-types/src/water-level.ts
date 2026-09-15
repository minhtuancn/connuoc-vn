import { z } from 'zod';

import { IsoInstantSchema, WaterLevelUnitSchema } from './common.js';
import {
  DataSourceIdSchema,
  DatumIdSchema,
  ForecastRunIdSchema,
  StationIdSchema,
} from './ids.js';
import { DataQualitySchema } from './source.js';

export const WaterLevelOriginSchema = z.enum(['observed', 'manual', 'community']);
export type WaterLevelOrigin = z.infer<typeof WaterLevelOriginSchema>;

/** One water-level measurement with explicit unit, datum, source and timestamp. */
export const WaterLevelObservationSchema = z
  .object({
    stationId: StationIdSchema,
    observedAt: IsoInstantSchema,
    value: z.number().finite(),
    unit: WaterLevelUnitSchema,
    datumId: DatumIdSchema,
    sourceId: DataSourceIdSchema,
    origin: WaterLevelOriginSchema,
    quality: DataQualitySchema.optional(),
  })
  .strict();
export type WaterLevelObservation = z.infer<typeof WaterLevelObservationSchema>;

export const ForecastKindSchema = z.enum([
  'astronomical_tide',
  'hydrological_forecast',
  'interpolated',
  'derived',
]);
export type ForecastKind = z.infer<typeof ForecastKindSchema>;

/** Metadata for a versioned prediction/forecast run. */
export const ForecastRunSchema = z
  .object({
    id: ForecastRunIdSchema,
    stationId: StationIdSchema,
    kind: ForecastKindSchema,
    modelId: z.string().trim().min(1).max(160),
    modelVersion: z.string().trim().min(1).max(80).optional(),
    generatedAt: IsoInstantSchema,
    validFrom: IsoInstantSchema,
    validTo: IsoInstantSchema,
    unit: WaterLevelUnitSchema,
    datumId: DatumIdSchema,
    sourceId: DataSourceIdSchema.optional(),
    quality: DataQualitySchema.optional(),
  })
  .strict()
  .refine((run) => Date.parse(run.validTo) >= Date.parse(run.validFrom), {
    message: '`validTo` must be at or after `validFrom`',
    path: ['validTo'],
  });
export type ForecastRun = z.infer<typeof ForecastRunSchema>;

/** Point belonging to a versioned forecast/prediction run. */
export const ForecastPointSchema = z
  .object({
    runId: ForecastRunIdSchema,
    stationId: StationIdSchema,
    timestamp: IsoInstantSchema,
    value: z.number().finite(),
    unit: WaterLevelUnitSchema,
    datumId: DatumIdSchema,
    quality: DataQualitySchema.optional(),
  })
  .strict();
export type ForecastPoint = z.infer<typeof ForecastPointSchema>;

/** Minimal deterministic point contract convenient for pure tide-engine output. */
export const WaterLevelPointSchema = z
  .object({
    timestamp: IsoInstantSchema,
    value: z.number().finite(),
    unit: WaterLevelUnitSchema,
    datumId: DatumIdSchema,
  })
  .strict();
export type WaterLevelPoint = z.infer<typeof WaterLevelPointSchema>;
