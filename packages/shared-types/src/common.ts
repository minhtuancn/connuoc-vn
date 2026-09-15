import { z } from 'zod';

/** ISO-8601 timestamp that carries an explicit UTC designator or numeric offset. */
export const IsoInstantSchema = z.string().datetime({ offset: true });
export type IsoInstant = z.infer<typeof IsoInstantSchema>;

/**
 * IANA timezone name. Validation intentionally happens at the contract boundary
 * so engines never have to guess a station timezone.
 */
export const TimeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
      return true;
    } catch {
      return false;
    }
  }, 'Expected a valid IANA timezone');
export type TimeZone = z.infer<typeof TimeZoneSchema>;

export const WaterLevelUnitSchema = z.enum(['m', 'cm', 'mm']);
export type WaterLevelUnit = z.infer<typeof WaterLevelUnitSchema>;

export const CoordinateSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export type Coordinate = z.infer<typeof CoordinateSchema>;

export const NameAliasesSchema = z.array(z.string().trim().min(1).max(160)).max(100);
