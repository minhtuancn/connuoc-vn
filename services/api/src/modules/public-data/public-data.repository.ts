import type { Pool } from 'pg';

import {
  PublicDataError,
  type LocationRecord,
  type PublicDataRepository,
  type QualityState,
  type StationRecord,
  type TideModelRecord,
  type WaterLevelPageRecord,
  type WaterLevelUnit,
} from './public-data.types.js';

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

interface LocationRow {
  public_id: string;
  name: string;
  station_type: string;
  time_zone: string;
  latitude: number | string;
  longitude: number | string;
  aliases: string[];
}

interface StationRow extends LocationRow {
  default_datum_id: string | null;
  source_key: string | null;
  import_run_id: string | null;
  checksum_sha256: string | null;
  parser_version: string | null;
  normalizer_version: string | null;
  provenance_observed_at: Date | string | null;
}

interface ObservationRow {
  source_record_key: string;
  observed_at: Date | string;
  value: number | string;
  unit: WaterLevelUnit;
  datum_id: string | null;
  quality_state: QualityState;
  source_key: string;
  import_run_id: string;
  checksum_sha256: string;
  parser_version: string;
  normalizer_version: string;
}

interface TideModelRow {
  id: string;
  public_id: string;
  time_zone: string;
  model_id: string;
  model_version: string | null;
  datum_id: string;
  unit: WaterLevelUnit;
  mean_level: number | string;
  reference_epoch: Date | string;
  phase_convention: TideModelRecord['phaseConvention'];
  source_key: string | null;
  import_run_id: string | null;
}

interface ConstituentRow {
  name: string;
  amplitude: number | string;
  phase_degrees: number | string;
  speed_degrees_per_hour: number | string;
}

export class PgPublicDataRepository implements PublicDataRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new PublicDataError('DATABASE_UNAVAILABLE', 'Public data database is not configured.');
    }
    return this.pool;
  }

  async searchLocations(query: string, limit: number, offset: number) {
    const result = await this.database().query<LocationRow>(
      `SELECT
         s.public_id,
         s.name,
         s.station_type,
         s.time_zone,
         ST_Y(s.location)::float8 AS latitude,
         ST_X(s.location)::float8 AS longitude,
         ARRAY(
           SELECT sa.alias
           FROM station_aliases sa
           WHERE sa.station_id = s.id
           ORDER BY sa.normalized_alias
         ) AS aliases
       FROM stations s
       WHERE
         lower(s.public_id) LIKE lower($1)
         OR lower(s.name) LIKE lower($1)
         OR EXISTS (
           SELECT 1 FROM station_aliases sa
           WHERE sa.station_id = s.id AND lower(sa.alias) LIKE lower($1)
         )
       ORDER BY lower(s.name), s.public_id
       LIMIT $2 OFFSET $3`,
      [`%${query}%`, limit + 1, offset],
    );

    const rows = result.rows.slice(0, limit);
    return {
      items: rows.map((row): LocationRecord => ({
        publicId: row.public_id,
        name: row.name,
        stationType: row.station_type,
        timeZone: row.time_zone,
        latitude: asNumber(row.latitude),
        longitude: asNumber(row.longitude),
        aliases: row.aliases ?? [],
      })),
      hasMore: result.rows.length > limit,
    };
  }

  async findStation(publicId: string): Promise<StationRecord | null> {
    const result = await this.database().query<StationRow>(
      `SELECT
         s.public_id,
         s.name,
         s.station_type,
         s.time_zone,
         s.default_datum_id,
         ST_Y(s.location)::float8 AS latitude,
         ST_X(s.location)::float8 AS longitude,
         ARRAY(
           SELECT sa.alias
           FROM station_aliases sa
           WHERE sa.station_id = s.id
           ORDER BY sa.normalized_alias
         ) AS aliases,
         p.source_key,
         p.import_run_id,
         p.checksum_sha256,
         p.parser_version,
         p.normalizer_version,
         p.provenance_observed_at
       FROM stations s
       LEFT JOIN LATERAL (
         SELECT
           ds.source_key,
           sir.id::text AS import_run_id,
           rp.checksum_sha256,
           sir.parser_version,
           sir.normalizer_version,
           o.observed_at AS provenance_observed_at
         FROM observations o
         JOIN data_sources ds ON ds.id = o.source_id
         JOIN source_import_runs sir ON sir.id = o.import_run_id
         JOIN raw_payloads rp ON rp.id = o.raw_payload_id
         WHERE o.station_id = s.id
         ORDER BY o.observed_at DESC, o.id DESC
         LIMIT 1
       ) p ON true
       WHERE s.public_id = $1`,
      [publicId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      publicId: row.public_id,
      name: row.name,
      stationType: row.station_type,
      timeZone: row.time_zone,
      latitude: asNumber(row.latitude),
      longitude: asNumber(row.longitude),
      defaultDatumId: row.default_datum_id,
      aliases: row.aliases ?? [],
      provenance:
        row.source_key &&
        row.import_run_id &&
        row.checksum_sha256 &&
        row.parser_version &&
        row.normalizer_version &&
        row.provenance_observed_at
          ? {
              sourceKey: row.source_key,
              importRunId: row.import_run_id,
              rawChecksumSha256: row.checksum_sha256,
              parserVersion: row.parser_version,
              normalizerVersion: row.normalizer_version,
              observedAt: asIso(row.provenance_observed_at),
            }
          : null,
    };
  }

  async listWaterLevels(input: {
    publicId: string;
    startUtc: string | null;
    endUtc: string | null;
    limit: number;
    offset: number;
  }): Promise<WaterLevelPageRecord | null> {
    const station = await this.findStation(input.publicId);
    if (!station) return null;

    const result = await this.database().query<ObservationRow>(
      `SELECT
         o.source_record_key,
         o.observed_at,
         o.value,
         o.unit,
         o.datum_id,
         o.quality_state,
         ds.source_key,
         sir.id::text AS import_run_id,
         rp.checksum_sha256,
         sir.parser_version,
         sir.normalizer_version
       FROM observations o
       JOIN stations s ON s.id = o.station_id
       JOIN data_sources ds ON ds.id = o.source_id
       JOIN source_import_runs sir ON sir.id = o.import_run_id
       JOIN raw_payloads rp ON rp.id = o.raw_payload_id
       WHERE s.public_id = $1
         AND ($2::timestamptz IS NULL OR o.observed_at >= $2::timestamptz)
         AND ($3::timestamptz IS NULL OR o.observed_at <= $3::timestamptz)
       ORDER BY o.observed_at DESC, o.id DESC
       LIMIT $4 OFFSET $5`,
      [input.publicId, input.startUtc, input.endUtc, input.limit + 1, input.offset],
    );

    const rows = result.rows.slice(0, input.limit);
    return {
      station,
      hasMore: result.rows.length > input.limit,
      items: rows.map((row) => ({
        sourceRecordKey: row.source_record_key,
        observedAt: asIso(row.observed_at),
        value: asNumber(row.value),
        unit: row.unit,
        datumId: row.datum_id,
        qualityState: row.quality_state,
        provenance: {
          sourceKey: row.source_key,
          importRunId: row.import_run_id,
          rawChecksumSha256: row.checksum_sha256,
          parserVersion: row.parser_version,
          normalizerVersion: row.normalizer_version,
          observedAt: asIso(row.observed_at),
        },
      })),
    };
  }

  async findActiveTideModel(publicId: string): Promise<TideModelRecord | null> {
    const database = this.database();
    const modelResult = await database.query<TideModelRow>(
      `SELECT
         tm.id,
         s.public_id,
         s.time_zone,
         tm.model_id,
         tm.model_version,
         tm.datum_id,
         tm.unit,
         tm.mean_level,
         tm.reference_epoch,
         tm.phase_convention,
         ds.source_key,
         tm.import_run_id::text AS import_run_id
       FROM tide_models tm
       JOIN stations s ON s.id = tm.station_id
       LEFT JOIN data_sources ds ON ds.id = tm.source_id
       WHERE s.public_id = $1 AND tm.is_active = true
       ORDER BY tm.updated_at DESC, tm.created_at DESC, tm.id DESC
       LIMIT 1`,
      [publicId],
    );

    const model = modelResult.rows[0];
    if (!model) return null;

    const constituents = await database.query<ConstituentRow>(
      `SELECT name, amplitude, phase_degrees, speed_degrees_per_hour
       FROM tide_constituents
       WHERE tide_model_id = $1
       ORDER BY ordinal`,
      [model.id],
    );

    return {
      stationPublicId: model.public_id,
      stationTimeZone: model.time_zone,
      modelId: model.model_id,
      modelVersion: model.model_version,
      datumId: model.datum_id,
      unit: model.unit,
      meanLevel: asNumber(model.mean_level),
      referenceEpochUtc: asIso(model.reference_epoch),
      phaseConvention: model.phase_convention,
      constituents: constituents.rows.map((row) => ({
        name: row.name,
        amplitude: asNumber(row.amplitude),
        phaseDegrees: asNumber(row.phase_degrees),
        speedDegreesPerHour: asNumber(row.speed_degrees_per_hour),
      })),
      provenance: {
        sourceKey: model.source_key,
        importRunId: model.import_run_id,
      },
    };
  }
}
