import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApplication } from '../src/bootstrap.js';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for location API integration tests');
}

const app = await buildApplication({ allowMissingDatabase: false, logger: false });
const client = new Client({ connectionString: databaseUrl, application_name: 'location-api-integration' });

beforeAll(async () => {
  await client.connect();
  await client.query(`TRUNCATE TABLE
    administrative_area_successors,
    administrative_area_aliases,
    administrative_areas
    RESTART IDENTITY CASCADE`);

  const source = await client.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('location-api-fixture', 'Location API Fixture', 'fixture')
     ON CONFLICT (source_key) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
  );
  const sourceId = source.rows[0]!.id;

  const province = await client.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:api:province', '31', 'Thành phố Hải Phòng', 'thanh pho hai phong', 'CENTRAL_CITY',
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,107 19,107 21,105 21,105 19))', 4326)), $1
     ) RETURNING id`,
    [sourceId],
  );

  const commune = await client.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind, parent_id,
       effective_from, is_current, geometry, geometry_source_id
     ) VALUES (
       'area:api:commune', '31001', 'Xã Nghĩa Phong', 'xa nghia phong', 'COMMUNE', $1,
       DATE '2025-07-01', true,
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)), $2
     ) RETURNING id`,
    [province.rows[0]!.id, sourceId],
  );

  const historical = await client.query<{ id: string }>(
    `INSERT INTO administrative_areas (
       public_id, official_code, name, normalized_name, area_kind,
       effective_from, effective_to, is_current, geometry_source_id
     ) VALUES (
       'area:api:legacy-district', 'LEGACY-NH', 'Huyện Nghĩa Hưng', 'huyen nghia hung',
       'HISTORICAL_DISTRICT', DATE '1997-01-01', DATE '2025-06-30', false, $1
     ) RETURNING id`,
    [sourceId],
  );

  await client.query(
    `INSERT INTO administrative_area_successors (
       predecessor_area_id, successor_area_id, relationship, effective_at, source_id
     ) VALUES ($1, $2, 'REORGANIZED_TO', DATE '2025-07-01', $3)`,
    [historical.rows[0]!.id, commune.rows[0]!.id, sourceId],
  );
});

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('versioned public location APIs', () => {
  it('searches current administrative areas anonymously without changing the legacy station default', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/search?q=Ngh%C4%A9a%20Phong&scope=administrative&effectiveAt=2026-09-17',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      items: [
        {
          matchKind: 'CURRENT',
          area: {
            publicId: 'area:api:commune',
            officialCode: '31001',
            kind: 'COMMUNE',
            isCurrent: true,
          },
        },
      ],
      meta: { scope: 'administrative', effectiveAt: '2026-09-17' },
    });
  });

  it('marks legacy district search results as historical and returns verified successors', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/search?q=Nghia%20Hung&scope=administrative&effectiveAt=2026-09-17',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items[0]).toMatchObject({
      matchKind: 'HISTORICAL',
      area: { publicId: 'area:api:legacy-district', kind: 'HISTORICAL_DISTRICT' },
      successors: [
        { publicId: 'area:api:commune', relationship: 'REORGANIZED_TO', effectiveAt: '2025-07-01' },
      ],
    });
  });

  it('resolves a WGS84 point to the two-tier hierarchy with explicit Vietnam timezone', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/resolve?lat=19.5&lon=105.5&effectiveAt=2026-09-17',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      latitude: 19.5,
      longitude: 105.5,
      spatialRepresentation: 'POINT',
      timeZone: 'Asia/Ho_Chi_Minh',
      effectiveAt: '2026-09-17',
      administrativeAreas: [
        { publicId: 'area:api:province', kind: 'CENTRAL_CITY' },
        { publicId: 'area:api:commune', kind: 'COMMUNE' },
      ],
    });
  });

  it('does not fabricate administrative context outside known polygons', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/resolve?lat=10&lon=110&effectiveAt=2026-09-17',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      latitude: 10,
      longitude: 110,
      timeZone: null,
      administrativeAreas: [],
    });
  });

  it.each([
    '/v1/locations/search?q=x&scope=administrative',
    '/v1/locations/search?q=Nghia&scope=administrative&limit=51',
    '/v1/locations/search?q=Nghia&scope=administrative&effectiveAt=2026-02-30',
    '/v1/locations/resolve?lat=91&lon=105',
  ])('rejects invalid public location request %s', async (url) => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(400);
  });
});
