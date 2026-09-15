import { z } from 'zod';

import { IsoInstantSchema, WaterLevelUnitSchema } from './common.js';
import { DataSourceIdSchema, DatumIdSchema } from './ids.js';

export const SourceAuthoritySchema = z.enum([
  'authoritative',
  'public',
  'partner',
  'community',
  'manual',
  'computed',
  'unknown',
]);
export type SourceAuthority = z.infer<typeof SourceAuthoritySchema>;

export const SourceAccessMethodSchema = z.enum([
  'api',
  'download',
  'publication',
  'partner_feed',
  'manual',
  'computed',
]);
export type SourceAccessMethod = z.infer<typeof SourceAccessMethodSchema>;

export const RedistributionStatusSchema = z.enum([
  'redistributable',
  'validation_only',
  'restricted',
  'unknown',
]);
export type RedistributionStatus = z.infer<typeof RedistributionStatusSchema>;

/** Metadata required to trace displayed/derived data back to its origin. */
export const DataSourceSchema = z
  .object({
    id: DataSourceIdSchema,
    name: z.string().trim().min(1).max(200),
    publisher: z.string().trim().min(1).max(200).optional(),
    authority: SourceAuthoritySchema,
    accessMethod: SourceAccessMethodSchema,
    homepageUrl: z.string().url().optional(),
    termsUrl: z.string().url().optional(),
    licenseName: z.string().trim().min(1).max(160).optional(),
    attribution: z.string().trim().min(1).max(500).optional(),
    redistribution: RedistributionStatusSchema,
    notes: z.string().trim().max(2_000).optional(),
  })
  .strict();
export type DataSource = z.infer<typeof DataSourceSchema>;

export const VerticalDatumKindSchema = z.enum([
  'chart_datum',
  'national_vertical_datum',
  'local_gauge',
  'model_reference',
  'unknown',
]);
export type VerticalDatumKind = z.infer<typeof VerticalDatumKindSchema>;

/**
 * Vertical reference metadata. No datum conversion is implied by sharing a unit.
 * Conversion/compatibility rules belong to an explicit datum policy/engine.
 */
export const DatumSchema = z
  .object({
    id: DatumIdSchema,
    name: z.string().trim().min(1).max(200),
    code: z.string().trim().min(1).max(80).optional(),
    kind: VerticalDatumKindSchema,
    unit: WaterLevelUnitSchema,
    sourceId: DataSourceIdSchema.optional(),
    description: z.string().trim().max(2_000).optional(),
  })
  .strict();
export type Datum = z.infer<typeof DatumSchema>;

export const DataQualityFlagSchema = z.enum([
  'stale',
  'gap',
  'outlier',
  'suspect',
  'manual',
  'community_unverified',
  'datum_unknown',
  'timezone_unknown',
  'interpolated',
]);
export type DataQualityFlag = z.infer<typeof DataQualityFlagSchema>;

export const DataQualitySchema = z
  .object({
    confidence: z.number().finite().min(0).max(1).optional(),
    flags: z.array(DataQualityFlagSchema).max(32).default([]),
    checkedAt: IsoInstantSchema.optional(),
    note: z.string().trim().max(1_000).optional(),
  })
  .strict();
export type DataQuality = z.infer<typeof DataQualitySchema>;
