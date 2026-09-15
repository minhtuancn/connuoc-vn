import { z } from 'zod';

/**
 * Stable opaque identifiers used across domain boundaries.
 *
 * IDs are intentionally transport/database agnostic. Persistence layers may map
 * them to UUIDs, slugs or external identifiers, but shared consumers only depend
 * on the validated string contract.
 */
export const EntityIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'Invalid entity identifier');

export const StationIdSchema = EntityIdSchema.brand<'StationId'>();
export type StationId = z.infer<typeof StationIdSchema>;

export const RiverIdSchema = EntityIdSchema.brand<'RiverId'>();
export type RiverId = z.infer<typeof RiverIdSchema>;

export const BasinIdSchema = EntityIdSchema.brand<'BasinId'>();
export type BasinId = z.infer<typeof BasinIdSchema>;

export const EstuaryIdSchema = EntityIdSchema.brand<'EstuaryId'>();
export type EstuaryId = z.infer<typeof EstuaryIdSchema>;

export const DatumIdSchema = EntityIdSchema.brand<'DatumId'>();
export type DatumId = z.infer<typeof DatumIdSchema>;

export const DataSourceIdSchema = EntityIdSchema.brand<'DataSourceId'>();
export type DataSourceId = z.infer<typeof DataSourceIdSchema>;

export const ForecastRunIdSchema = EntityIdSchema.brand<'ForecastRunId'>();
export type ForecastRunId = z.infer<typeof ForecastRunIdSchema>;
