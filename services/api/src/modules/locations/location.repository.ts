import { normalizeVietnameseSearchText } from '@connuoc/geo';
import type { AdministrativeAreaKind } from '@connuoc/shared-types';
import type { Pool } from 'pg';

import type {
  AdministrativeAreaRecord,
  AdministrativeAreaSuccessorRef,
  LocationSearchOptions,
  LocationSearchResult,
  PointResolveOptions,
  ResolvedLocation,
} from './location.types.js';

interface AreaRow {
  id: string;
  public_id: string;
  official_code: string;
  name: string;
  normalized_name: string;
  area_kind: AdministrativeAreaKind;
  effective_from: Date | string;
  effective_to: Date | string | null;
  is_current: boolean;
  geometry_source_id: string | null;
  match_kind?: 'CURRENT' | 'HISTORICAL';
}

interface SuccessorRow {
  predecessor_area_id: string;
  public_id: string;
  relationship: AdministrativeAreaSuccessorRef['relationship'];
  effective_at: Date | string;
}

function asDate(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function toArea(row: AreaRow): AdministrativeAreaRecord {
  return {
    publicId: row.public_id,
    officialCode: row.official_code,
    name: row.name,
    normalizedName: row.normalized_name,
    kind: row.area_kind,
    effectiveFrom: asDate(row.effective_from),
    effectiveTo: row.effective_to === null ? null : asDate(row.effective_to),
    isCurrent: row.is_current,
    geometrySourceId: row.geometry_source_id,
  };
}

export class LocationRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('Location database is not configured.');
    }
    return this.pool;
  }

  async search(options: LocationSearchOptions): Promise<readonly LocationSearchResult[]> {
    const normalizedQuery = normalizeVietnameseSearchText(options.query);
    if (!normalizedQuery) return [];

    const result = await this.database().query<AreaRow>(
      `WITH candidates AS (
         SELECT DISTINCT ON (a.id)
           a.id,
           a.public_id,
           a.official_code,
           a.name,
           a.normalized_name,
           a.area_kind,
           a.effective_from,
           a.effective_to,
           a.is_current,
           a.geometry_source_id,
           CASE
             WHEN a.is_current = true
              AND a.effective_from <= $2::date
              AND (a.effective_to IS NULL OR a.effective_to >= $2::date)
             THEN 'CURRENT'
             ELSE 'HISTORICAL'
           END AS match_kind
         FROM administrative_areas a
         LEFT JOIN administrative_area_aliases aa ON aa.area_id = a.id
         WHERE a.normalized_name LIKE $1 OR aa.normalized_alias LIKE $1
         ORDER BY a.id, aa.normalized_alias NULLS LAST
       )
       SELECT *
       FROM candidates
       ORDER BY
         CASE match_kind WHEN 'CURRENT' THEN 0 ELSE 1 END,
         normalized_name,
         public_id
       LIMIT $3`,
      [`%${normalizedQuery}%`, asDate(options.effectiveAt), options.limit],
    );

    if (result.rows.length === 0) return [];

    const successors = await this.database().query<SuccessorRow>(
      `SELECT
         s.predecessor_area_id,
         successor.public_id,
         s.relationship,
         s.effective_at
       FROM administrative_area_successors s
       JOIN administrative_areas successor ON successor.id = s.successor_area_id
       WHERE s.predecessor_area_id = ANY($1::uuid[])
       ORDER BY s.predecessor_area_id, s.effective_at, successor.public_id`,
      [result.rows.map((row) => row.id)],
    );

    const successorsByArea = new Map<string, AdministrativeAreaSuccessorRef[]>();
    for (const row of successors.rows) {
      const refs = successorsByArea.get(row.predecessor_area_id) ?? [];
      refs.push({
        publicId: row.public_id,
        relationship: row.relationship,
        effectiveAt: asDate(row.effective_at),
      });
      successorsByArea.set(row.predecessor_area_id, refs);
    }

    return result.rows.map((row) => ({
      matchKind: row.match_kind ?? 'HISTORICAL',
      area: toArea(row),
      successors: successorsByArea.get(row.id) ?? [],
    }));
  }

  async resolvePoint(options: PointResolveOptions): Promise<ResolvedLocation> {
    const result = await this.database().query<AreaRow>(
      `SELECT
         a.id,
         a.public_id,
         a.official_code,
         a.name,
         a.normalized_name,
         a.area_kind,
         a.effective_from,
         a.effective_to,
         a.is_current,
         a.geometry_source_id
       FROM administrative_areas a
       WHERE a.geometry IS NOT NULL
         AND a.effective_from <= $3::date
         AND (a.effective_to IS NULL OR a.effective_to >= $3::date)
         AND ST_Covers(
           a.geometry,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)
         )
       ORDER BY
         CASE a.area_kind
           WHEN 'PROVINCE' THEN 0
           WHEN 'CENTRAL_CITY' THEN 0
           WHEN 'HISTORICAL_DISTRICT' THEN 1
           ELSE 2
         END,
         a.normalized_name,
         a.public_id`,
      [options.latitude, options.longitude, asDate(options.effectiveAt)],
    );

    return {
      latitude: options.latitude,
      longitude: options.longitude,
      spatialRepresentation: 'POINT',
      administrativeAreas: result.rows.map(toArea),
    };
  }
}
