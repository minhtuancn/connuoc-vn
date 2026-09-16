import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LocationRepository } from '../src/modules/locations/location.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for location repository integration tests');
}

const pool = new Pool({ connectionString: databaseUrl, application_name: 'location-repository-integration' });
let repository: LocationRepository;

async function seed(): Promise<void> {
  await pool.query(`TRUNCATE TABLE
    administrative_area_successors,
    administrative_area_aliases,
    administrative_areas,
    data_sources
    RESTART IDENTITY CASCADE`);

  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('location-fixture', 'Location Fixture', 'fixture') RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;

  const province = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:fixture:province', '31', 'Thành phố Hải Phòng', 'thanh pho hai phong',
       'CENTRAL_CITY', DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,107 19,107 21,105 21,105 19))', 4326)),
       $1
     ) RETURNING id`,
    [sourceId],
  );

  const communeA = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind, parent_id,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:fixture:commune-a', '31001', 'Xã Nghĩa Phong', 'xa nghia phong', 'COMMUNE', $1,
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       $2
     ) RETURNING id`,
    [province.rows[0]!.id, sourceId],
  );

  await pool.query(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind, parent_id,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:fixture:ward-b', '31002', 'Phường Hồng Phong', 'phuong hong phong', 'WARD', $1,
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((106 19,107 19,107 20,106 20,106 19))', 4326)),
       $2
     )`,
    [province.rows[0]!.id, sourceId],
  );

  const legacyDistrict = await pool.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, effective_to, is_current, geometry_source_id
     ) VALUES (
       'area:fixture:legacy-district', 'LEGACY-NH', 'Huyện Nghĩa Hưng', 'huyen nghia hung',
       'HISTORICAL_DISTRICT', DATE '1997-01-01', DATE '2025-06-30', false, $1
     ) RETURNING id`,
    [sourceId],
  );

  await pool.query(
    `INSERT INTO administrative_area_aliases (
       area_id, alias, normalized_alias, alias_kind, effective_from, effective_to, source_id
     ) VALUES ($1, 'Nghia Hung', 'nghia hung', 'LEGACY_DISTRICT',
       DATE '1997-01-01', DATE '2025-06-30', $2)`,
    [legacyDistrict.rows[0]!.id, sourceId],
  );

  await pool.query(
    `INSERT INTO administrative_area_successors (
       predecessor_area_id, successor_area_id, relationship, effective_at, source_id
     ) VALUES ($1, $2, 'REORGANIZED_TO', DATE '2025-07-01', $3)`,
    [legacyDistrict.rows[0]!.id, communeA.rows[0]!.id, sourceId],
  );
}

beforeAll(async () => {
  await seed();
  repository = new LocationRepository(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('versioned administrative location repository', () => {
  it('resolves a current point to the active two-tier chain parent-first', async () => {
    const result = await repository.resolvePoint({
      latitude: 19.5,
      longitude: 105.5,
      effectiveAt: new Date('2026-09-17T00:00:00Z'),
    });

    expect(result.spatialRepresentation).toBe('POINT');
    expect(result.administrativeAreas.map((area) => [area.publicId, area.kind])).toEqual([
      ['area:fixture:province', 'CENTRAL_CITY'],
      ['area:fixture:commune-a', 'COMMUNE'],
    ]);
    expect(result.administrativeAreas.every((area) => area.kind !== 'HISTORICAL_DISTRICT')).toBe(true);
    expect(result.administrativeAreas.every((area) => area.geometrySourceId !== null)).toBe(true);
  });

  it('returns a historical legacy-name match with verified successor references', async () => {
    const results = await repository.search({
      query: 'Nghĩa Hưng',
      effectiveAt: new Date('2026-09-17T00:00:00Z'),
      limit: 10,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      matchKind: 'HISTORICAL',
      area: {
        publicId: 'area:fixture:legacy-district',
        kind: 'HISTORICAL_DISTRICT',
        isCurrent: false,
      },
      successors: [
        {
          publicId: 'area:fixture:commune-a',
          relationship: 'REORGANIZED_TO',
          effectiveAt: '2025-07-01',
        },
      ],
    });
  });

  it('normalizes Vietnamese search text through the shared geo behavior', async () => {
    const results = await repository.search({
      query: '  NGHĨA   PHONG ',
      effectiveAt: new Date('2026-09-17T00:00:00Z'),
      limit: 10,
    });

    expect(results[0]?.area.publicId).toBe('area:fixture:commune-a');
    expect(results[0]?.matchKind).toBe('CURRENT');
  });

  it('returns an empty administrative context outside known polygons', async () => {
    const result = await repository.resolvePoint({
      latitude: 10,
      longitude: 110,
      effectiveAt: new Date('2026-09-17T00:00:00Z'),
    });

    expect(result).toMatchObject({
      latitude: 10,
      longitude: 110,
      spatialRepresentation: 'POINT',
      administrativeAreas: [],
    });
  });
});
