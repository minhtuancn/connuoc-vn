import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RiverReachRepository } from '../src/modules/hydrology/river-reach.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for river reach repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'river-reach-repository-integration',
});

let providerId: string;
let repository: RiverReachRepository;

beforeAll(async () => {
  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('river-reach-repo-fixture', 'River reach repo fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:river-reach-repo', 'River Reach Repo Basin')
     RETURNING id`,
  );

  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:river-reach-repo',
       $1,
       'River Reach Repo River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.48 19.48,105.56 19.56)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, health_state, health_blocks_selection
     ) VALUES (
       'river-reach-provider', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED',
       'River reach fixture', 'HEALTHY', false
     )
     RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  const reaches = await pool.query<{ id: string; public_id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES
       (
         'reach:repo:mapped', $1, $2, 'Mapped Reach',
         ST_Multi(ST_GeomFromText('LINESTRING(105.495 19.495,105.505 19.505)', 4326)),
         $3
       ),
       (
         'reach:repo:ambiguous', $1, $2, 'Ambiguous Reach',
         ST_Multi(ST_GeomFromText('LINESTRING(105.505 19.505,105.515 19.515)', 4326)),
         $3
       ),
       (
         'reach:repo:unmapped', $1, $2, 'Unmapped Reach',
         ST_Multi(ST_GeomFromText('LINESTRING(105.515 19.515,105.525 19.525)', 4326)),
         $3
       )
     RETURNING id, public_id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );

  const byPublicId = new Map(reaches.rows.map((row) => [row.public_id, row.id]));

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES (
       $1, $2, '111111111', 'geoglows-v2', '2',
       'MAPPED', 'MANUAL', 0.99, 0.1,
       '2026-09-01T00:00:00Z'
     )`,
    [byPublicId.get('reach:repo:mapped'), providerId],
  );

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES
       (
         $1, $2, '222222221', 'geoglows-v2', '2',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.62, 0.4,
         '2026-09-01T00:00:00Z'
       ),
       (
         $1, $2, '222222222', 'geoglows-v2', '2',
         'AMBIGUOUS', 'NEAREST_GEOMETRY', 0.60, 0.5,
         '2026-09-01T00:00:00Z'
       )`,
    [byPublicId.get('reach:repo:ambiguous'), providerId],
  );

  repository = new RiverReachRepository(pool);
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM river_reach_provider_mappings
     WHERE provider_config_id = $1`,
    [providerId],
  );
  await pool.query(
    `DELETE FROM river_reaches
     WHERE public_id LIKE 'reach:repo:%'`,
  );
  await pool.query(
    `DELETE FROM rivers WHERE public_id = 'river:river-reach-repo'`,
  );
  await pool.query(
    `DELETE FROM basins WHERE public_id = 'basin:river-reach-repo'`,
  );
  await pool.query(
    `DELETE FROM provider_configs WHERE id = $1`,
    [providerId],
  );
  await pool.query(
    `DELETE FROM data_sources WHERE source_key = 'river-reach-repo-fixture'`,
  );
  await pool.end();
});

describe('RiverReachRepository', () => {
  it('returns nearby normalized reaches ordered by geometric distance', async () => {
    const reaches = await repository.findNearby({
      latitude: 19.5,
      longitude: 105.5,
      radiusKm: 10,
      limit: 10,
    });

    expect(reaches.map((reach) => reach.publicId)).toEqual([
      'reach:repo:mapped',
      'reach:repo:ambiguous',
      'reach:repo:unmapped',
    ]);
    expect(reaches[0]).toMatchObject({
      name: 'Mapped Reach',
      riverPublicId: 'river:river-reach-repo',
      basinPublicId: 'basin:river-reach-repo',
    });
    expect(reaches[0]!.distanceKm).toBeLessThan(reaches[1]!.distanceKm);
    expect(reaches[1]!.distanceKm).toBeLessThan(reaches[2]!.distanceKm);
  });

  it('returns an exact current provider mapping when one exists', async () => {
    await expect(
      repository.findProviderResolution({
        riverReachPublicId: 'reach:repo:mapped',
        providerConfigId: providerId,
        atUtc: '2026-09-18T00:00:00Z',
      }),
    ).resolves.toEqual({
      state: 'MAPPED',
      providerKey: 'river-reach-provider',
      selectedProviderReachId: '111111111',
      candidates: [
        {
          providerReachId: '111111111',
          distanceKm: 0.1,
          confidence: 0.99,
        },
      ],
    });
  });

  it('never auto-selects between competing ambiguous provider mappings', async () => {
    const resolution = await repository.findProviderResolution({
      riverReachPublicId: 'reach:repo:ambiguous',
      providerConfigId: providerId,
      atUtc: '2026-09-18T00:00:00Z',
    });

    expect(resolution).toEqual({
      state: 'AMBIGUOUS',
      providerKey: 'river-reach-provider',
      selectedProviderReachId: null,
      candidates: [
        {
          providerReachId: '222222221',
          distanceKm: 0.4,
          confidence: 0.62,
        },
        {
          providerReachId: '222222222',
          distanceKm: 0.5,
          confidence: 0.6,
        },
      ],
    });
  });

  it('returns UNMAPPED when a normalized reach has no provider association', async () => {
    await expect(
      repository.findProviderResolution({
        riverReachPublicId: 'reach:repo:unmapped',
        providerConfigId: providerId,
        atUtc: '2026-09-18T00:00:00Z',
      }),
    ).resolves.toEqual({
      state: 'UNMAPPED',
      providerKey: 'river-reach-provider',
      selectedProviderReachId: null,
      candidates: [],
    });
  });

  it('returns null instead of fabricating a resolution for unknown reach/provider identities', async () => {
    await expect(
      repository.findProviderResolution({
        riverReachPublicId: 'reach:repo:does-not-exist',
        providerConfigId: providerId,
        atUtc: '2026-09-18T00:00:00Z',
      }),
    ).resolves.toBeNull();

    await expect(
      repository.findProviderResolution({
        riverReachPublicId: 'reach:repo:mapped',
        providerConfigId: '00000000-0000-0000-0000-000000000000',
        atUtc: '2026-09-18T00:00:00Z',
      }),
    ).resolves.toBeNull();
  });
});
