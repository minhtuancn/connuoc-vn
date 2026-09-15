import { z } from 'zod';

import { CoordinateSchema, NameAliasesSchema, TimeZoneSchema } from './common.js';
import {
  BasinIdSchema,
  DataSourceIdSchema,
  DatumIdSchema,
  EstuaryIdSchema,
  RiverIdSchema,
  StationIdSchema,
} from './ids.js';

const SourceIdsSchema = z.array(DataSourceIdSchema).max(32).default([]);

export const BasinSchema = z
  .object({
    id: BasinIdSchema,
    name: z.string().trim().min(1).max(160),
    aliases: NameAliasesSchema.default([]),
    sourceIds: SourceIdsSchema,
  })
  .strict();
export type Basin = z.infer<typeof BasinSchema>;

export const RiverSchema = z
  .object({
    id: RiverIdSchema,
    name: z.string().trim().min(1).max(160),
    aliases: NameAliasesSchema.default([]),
    basinId: BasinIdSchema.optional(),
    sourceIds: SourceIdsSchema,
  })
  .strict();
export type River = z.infer<typeof RiverSchema>;

export const EstuarySchema = z
  .object({
    id: EstuaryIdSchema,
    name: z.string().trim().min(1).max(160),
    aliases: NameAliasesSchema.default([]),
    coordinate: CoordinateSchema.optional(),
    riverIds: z.array(RiverIdSchema).max(32).default([]),
    basinId: BasinIdSchema.optional(),
    sourceIds: SourceIdsSchema,
  })
  .strict();
export type Estuary = z.infer<typeof EstuarySchema>;

export const StationTypeSchema = z.enum([
  'tide',
  'water_level',
  'meteorological',
  'multi',
  'virtual',
]);
export type StationType = z.infer<typeof StationTypeSchema>;

export const StationStatusSchema = z.enum(['active', 'inactive', 'proposed', 'unknown']);
export type StationStatus = z.infer<typeof StationStatusSchema>;

/** Canonical station metadata used by engines and later API/storage adapters. */
export const StationSchema = z
  .object({
    id: StationIdSchema,
    name: z.string().trim().min(1).max(160),
    aliases: NameAliasesSchema.default([]),
    type: StationTypeSchema,
    status: StationStatusSchema.default('unknown'),
    coordinate: CoordinateSchema,
    timeZone: TimeZoneSchema,
    datumId: DatumIdSchema.optional(),
    riverId: RiverIdSchema.optional(),
    estuaryId: EstuaryIdSchema.optional(),
    basinId: BasinIdSchema.optional(),
    sourceIds: SourceIdsSchema,
  })
  .strict();
export type Station = z.infer<typeof StationSchema>;
