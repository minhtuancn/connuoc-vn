import { z } from 'zod';

import { CoordinateSchema, TimeZoneSchema } from './common.js';

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Expected a valid ISO calendar date');

export const AdministrativeAreaKindSchema = z.enum([
  'PROVINCE',
  'CENTRAL_CITY',
  'COMMUNE',
  'WARD',
  'SPECIAL_ZONE',
  'HISTORICAL_DISTRICT',
]);
export type AdministrativeAreaKind = z.infer<typeof AdministrativeAreaKindSchema>;

export const AdministrativeAreaRefSchema = z
  .object({
    publicId: z.string().trim().min(1).max(160),
    officialCode: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(160),
    normalizedName: z.string().trim().min(1).max(160),
    kind: AdministrativeAreaKindSchema,
    effectiveFrom: IsoDateSchema,
    effectiveTo: IsoDateSchema.nullable(),
    isCurrent: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.effectiveTo !== null && value.effectiveTo < value.effectiveFrom) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveTo'],
        message: 'effectiveTo must be on or after effectiveFrom',
      });
    }

    if (value.kind === 'HISTORICAL_DISTRICT' && value.isCurrent) {
      context.addIssue({
        code: 'custom',
        path: ['isCurrent'],
        message: 'Historical districts cannot be current administrative areas',
      });
    }

    if (value.isCurrent && value.effectiveTo !== null) {
      context.addIssue({
        code: 'custom',
        path: ['effectiveTo'],
        message: 'Current administrative areas must be open-ended',
      });
    }
  });
export type AdministrativeAreaRef = z.infer<typeof AdministrativeAreaRefSchema>;

export const ForecastLocationSchema = z
  .object({
    latitude: CoordinateSchema.shape.latitude,
    longitude: CoordinateSchema.shape.longitude,
    timeZone: TimeZoneSchema,
    administrativeAreas: z.array(AdministrativeAreaRefSchema).max(16),
    spatialRepresentation: z.literal('POINT'),
  })
  .strict();
export type ForecastLocation = z.infer<typeof ForecastLocationSchema>;
