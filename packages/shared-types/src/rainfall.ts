import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const RainfallAmountMmSchema = z.number().finite().min(0).max(10_000);
const AccumulationSecondsSchema = z.number().int().positive().max(31_536_000);
const CoordinateLatitudeSchema = z.number().finite().min(-90).max(90);
const CoordinateLongitudeSchema = z.number().finite().min(-180).max(180);

export const RainfallProductKindSchema = z.enum([
  'GAUGE_OBSERVATION',
  'RADAR_ESTIMATE',
  'SATELLITE_ESTIMATE',
  'REANALYSIS',
  'DETERMINISTIC_FORECAST',
  'ENSEMBLE_FORECAST',
  'BLENDED_DERIVED',
]);
export type RainfallProductKind = z.infer<typeof RainfallProductKindSchema>;

export const RainfallSpatialRepresentationSchema = z.enum([
  'GAUGE',
  'POINT',
  'GRID_CELL',
  'BASIN_AGGREGATE',
]);
export type RainfallSpatialRepresentation = z.infer<
  typeof RainfallSpatialRepresentationSchema
>;

export const RainfallQualityStateSchema = z.enum([
  'VALID',
  'ESTIMATED',
  'SUSPECT',
  'MISSING',
]);
export type RainfallQualityState = z.infer<typeof RainfallQualityStateSchema>;

export const RainfallSpatialMetadataSchema = z
  .object({
    representation: RainfallSpatialRepresentationSchema,
    latitude: CoordinateLatitudeSchema,
    longitude: CoordinateLongitudeSchema,
    resolutionKm: z.number().finite().positive().max(50_000).nullable(),
    stationId: z.string().trim().min(1).max(200).nullable(),
  })
  .strict();
export type RainfallSpatialMetadata = z.infer<typeof RainfallSpatialMetadataSchema>;

export const RainfallQualitySchema = z
  .object({
    state: RainfallQualityStateSchema,
    flags: z.array(z.string().trim().min(1).max(120)).max(64),
  })
  .strict();
export type RainfallQuality = z.infer<typeof RainfallQualitySchema>;

export const RainfallSourceProvenanceSchema = z
  .object({
    sourceId: z.string().trim().min(1).max(200),
    providerConfigId: z.string().trim().min(1).max(200).nullable(),
    productId: z.string().trim().min(1).max(200),
    productVersion: z.string().trim().min(1).max(200).nullable(),
    modelRunAt: IsoInstantSchema.nullable(),
    observedAt: IsoInstantSchema.nullable(),
    fetchedAt: IsoInstantSchema,
    attributionText: z.string().trim().min(1).max(500),
    attributionUrl: z.string().url().max(2048).nullable(),
  })
  .strict();
export type RainfallSourceProvenance = z.infer<typeof RainfallSourceProvenanceSchema>;

export const RainfallRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(240),
    productKind: RainfallProductKindSchema,
    validStart: IsoInstantSchema,
    validEnd: IsoInstantSchema,
    accumulationSeconds: AccumulationSecondsSchema,
    amountMm: RainfallAmountMmSchema,
    unit: z.literal('mm'),
    spatial: RainfallSpatialMetadataSchema,
    quality: RainfallQualitySchema,
    source: RainfallSourceProvenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const startMs = Date.parse(value.validStart);
    const endMs = Date.parse(value.validEnd);

    if (endMs <= startMs) {
      context.addIssue({
        code: 'custom',
        path: ['validEnd'],
        message: 'validEnd must be later than validStart',
      });
    } else {
      const expectedSeconds = (endMs - startMs) / 1000;
      if (value.accumulationSeconds !== expectedSeconds) {
        context.addIssue({
          code: 'custom',
          path: ['accumulationSeconds'],
          message: 'accumulationSeconds must equal the valid interval duration',
        });
      }
    }

    const isGaugeObservation = value.productKind === 'GAUGE_OBSERVATION';
    const usesGaugeSpatial = value.spatial.representation === 'GAUGE';

    if (isGaugeObservation) {
      if (!usesGaugeSpatial) {
        context.addIssue({
          code: 'custom',
          path: ['spatial', 'representation'],
          message: 'gauge observations must use GAUGE spatial representation',
        });
      }
      if (value.spatial.stationId === null) {
        context.addIssue({
          code: 'custom',
          path: ['spatial', 'stationId'],
          message: 'gauge observations require stationId',
        });
      }
    } else if (usesGaugeSpatial) {
      context.addIssue({
        code: 'custom',
        path: ['spatial', 'representation'],
        message: 'non-gauge rainfall products cannot use GAUGE spatial representation',
      });
    }
  });
export type RainfallRecord = z.infer<typeof RainfallRecordSchema>;
