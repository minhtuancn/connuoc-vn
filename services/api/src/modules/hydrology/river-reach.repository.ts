import {
  RiverReachResolutionSchema,
  type RiverReachResolution,
} from '@connuoc/shared-types';
import type { Pool } from 'pg';

export interface NearbyRiverReachQuery {
  readonly latitude: number;
  readonly longitude: number;
  readonly radiusKm: number;
  readonly limit: number;
}

export interface NearbyRiverReach {
  readonly publicId: string;
  readonly name: string;
  readonly riverPublicId: string | null;
  readonly basinPublicId: string | null;
  readonly distanceKm: number;
}

export interface ProviderReachResolutionQuery {
  readonly riverReachPublicId: string;
  readonly providerConfigId: string;
  readonly atUtc: string;
}

interface NearbyReachRow {
  public_id: string;
  name: string;
  river_public_id: string | null;
  basin_public_id: string | null;
  distance_km: number | string;
}

interface ProviderMappingRow {
  provider_key: string;
  provider_reach_id: string | null;
  mapping_state: 'MAPPED' | 'AMBIGUOUS' | null;
  confidence: number | string | null;
  distance_km: number | string | null;
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function assertCoordinate(latitude: number, longitude: number): void {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError('river reach coordinate is invalid');
  }
}

function assertInstant(value: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError('atUtc must be a valid ISO instant');
  }
}

export class RiverReachRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('River reach database is not configured.');
    }
    return this.pool;
  }

  async findNearby(
    query: NearbyRiverReachQuery,
  ): Promise<readonly NearbyRiverReach[]> {
    assertCoordinate(query.latitude, query.longitude);
    if (
      !Number.isFinite(query.radiusKm) ||
      query.radiusKm <= 0 ||
      query.radiusKm > 500
    ) {
      throw new RangeError('radiusKm must be greater than 0 and at most 500');
    }
    if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100) {
      throw new RangeError('limit must be an integer between 1 and 100');
    }

    const result = await this.database().query<NearbyReachRow>(
      `SELECT
         rr.public_id,
         rr.name,
         r.public_id AS river_public_id,
         b.public_id AS basin_public_id,
         ST_Distance(
           rr.geometry::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) / 1000.0 AS distance_km
       FROM river_reaches rr
       LEFT JOIN rivers r ON r.id = rr.river_id
       LEFT JOIN basins b ON b.id = rr.basin_id
       WHERE rr.geometry IS NOT NULL
         AND ST_DWithin(
           rr.geometry::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $3 * 1000.0
         )
       ORDER BY distance_km ASC, rr.public_id ASC
       LIMIT $4`,
      [query.latitude, query.longitude, query.radiusKm, query.limit],
    );

    return result.rows.map((row) => ({
      publicId: row.public_id,
      name: row.name,
      riverPublicId: row.river_public_id,
      basinPublicId: row.basin_public_id,
      distanceKm: asNumber(row.distance_km),
    }));
  }

  async findProviderResolution(
    query: ProviderReachResolutionQuery,
  ): Promise<RiverReachResolution | null> {
    if (query.riverReachPublicId.trim().length === 0) {
      throw new RangeError('riverReachPublicId must not be empty');
    }
    if (query.providerConfigId.trim().length === 0) {
      throw new RangeError('providerConfigId must not be empty');
    }
    assertInstant(query.atUtc);

    const result = await this.database().query<ProviderMappingRow>(
      `SELECT
         pc.provider_key,
         m.provider_reach_id,
         m.mapping_state,
         m.confidence,
         m.distance_km
       FROM river_reaches rr
       CROSS JOIN provider_configs pc
       LEFT JOIN river_reach_provider_mappings m
         ON m.river_reach_id = rr.id
        AND m.provider_config_id = pc.id
        AND m.effective_from <= $3::timestamptz
        AND (m.effective_to IS NULL OR m.effective_to >= $3::timestamptz)
       WHERE rr.public_id = $1
         AND pc.id = $2::uuid
       ORDER BY
         CASE m.mapping_state WHEN 'MAPPED' THEN 0 WHEN 'AMBIGUOUS' THEN 1 ELSE 2 END,
         m.confidence DESC NULLS LAST,
         m.distance_km ASC NULLS LAST,
         m.provider_reach_id ASC NULLS LAST`,
      [
        query.riverReachPublicId,
        query.providerConfigId,
        query.atUtc,
      ],
    );

    const first = result.rows[0];
    if (!first) return null;

    const candidateById = new Map<
      string,
      {
        providerReachId: string;
        distanceKm: number | null;
        confidence: number;
      }
    >();

    for (const row of result.rows) {
      if (
        row.provider_reach_id === null ||
        row.confidence === null
      ) {
        continue;
      }
      const candidate = {
        providerReachId: row.provider_reach_id,
        distanceKm:
          row.distance_km === null ? null : asNumber(row.distance_km),
        confidence: asNumber(row.confidence),
      };
      const existing = candidateById.get(candidate.providerReachId);
      if (
        !existing ||
        candidate.confidence > existing.confidence ||
        (candidate.confidence === existing.confidence &&
          candidate.distanceKm !== null &&
          (existing.distanceKm === null ||
            candidate.distanceKm < existing.distanceKm))
      ) {
        candidateById.set(candidate.providerReachId, candidate);
      }
    }

    const candidates = [...candidateById.values()].sort(
      (left, right) =>
        right.confidence - left.confidence ||
        (left.distanceKm ?? Number.POSITIVE_INFINITY) -
          (right.distanceKm ?? Number.POSITIVE_INFINITY) ||
        left.providerReachId.localeCompare(right.providerReachId),
    );

    if (candidates.length === 0) {
      return RiverReachResolutionSchema.parse({
        state: 'UNMAPPED',
        providerKey: first.provider_key,
        selectedProviderReachId: null,
        candidates: [],
      });
    }

    const hasAmbiguousEvidence = result.rows.some(
      (row) => row.mapping_state === 'AMBIGUOUS',
    );
    const mappedIds = new Set(
      result.rows
        .filter((row) => row.mapping_state === 'MAPPED')
        .flatMap((row) =>
          row.provider_reach_id === null ? [] : [row.provider_reach_id],
        ),
    );

    if (
      hasAmbiguousEvidence ||
      mappedIds.size > 1 ||
      candidates.length > 1
    ) {
      if (candidates.length < 2) {
        throw new Error(
          'Ambiguous river reach mapping requires at least two provider candidates.',
        );
      }
      return RiverReachResolutionSchema.parse({
        state: 'AMBIGUOUS',
        providerKey: first.provider_key,
        selectedProviderReachId: null,
        candidates,
      });
    }

    const selected = candidates[0]!;
    return RiverReachResolutionSchema.parse({
      state: 'MAPPED',
      providerKey: first.provider_key,
      selectedProviderReachId: selected.providerReachId,
      candidates,
    });
  }
}
