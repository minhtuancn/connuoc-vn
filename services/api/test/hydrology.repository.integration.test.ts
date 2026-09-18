import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FixtureHydrologyAdapter } from '@connuoc/weather-worker';

import { HydrologyRepository } from '../src/modules/hydrology/hydrology.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for hydrology repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'hydrology-repository-integration',
});

let providerId: string;
let repository: HydrologyRepository;
let adapter: FixtureHydrologyAdapter;

beforeAll(async () => {
  const source = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('hydrology-repository-fixture', 'Hydrology Repository Fixture', 'fixture')
     RETURNING id`,
  );

  const basin = await pool.query<{ id: string }>(
    `INSERT INTO basins (public_id, name)
     VALUES ('basin:hydrology-repository', 'Hydrology Repository Basin')
     RETURNING id`,
  );

  const river = await pool.query<{ id: string }>(
    `INSERT INTO rivers (public_id, basin_id, name, geometry)
     VALUES (
       'river:hydrology-repository',
       $1,
       'Hydrology Repository River',
       ST_Multi(ST_GeomFromText('LINESTRING(105.4 19.4,105.6 19.6)', 4326))
     )
     RETURNING id`,
    [basin.rows[0]!.id],
  );

  const reach = await pool.query<{ id: string }>(
    `INSERT INTO river_reaches (
       public_id, river_id, basin_id, name, geometry, geometry_source_id
     ) VALUES (
       'reach:hydrology-repository',
       $1,
       $2,
       'Hydrology Repository Reach',
       ST_Multi(ST_GeomFromText('LINESTRING(105.49 19.49,105.51 19.51)', 4326)),
       $3
     )
     RETURNING id`,
    [river.rows[0]!.id, basin.rows[0]!.id, source.rows[0]!.id],
  );

  const provider = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, freshness_policy, health_state, health_blocks_selection
     ) VALUES (
       'hydrology-repository-provider', $1, 'fixture', true, 100, 1,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED',
       'Hydrology repository fixture', '{"maxAgeSeconds":3600}'::jsonb,
       'HEALTHY', false
     )
     RETURNING id`,
    [source.rows[0]!.id],
  );
  providerId = provider.rows[0]!.id;

  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES
       ($1, 'hydrology.dischargeForecast', true),
       ($1, 'hydrology.returnPeriods', true)`,
    [providerId],
  );

  await pool.query(
    `INSERT INTO river_reach_provider_mappings (
       river_reach_id, provider_config_id, provider_reach_id,
       provider_product_id, provider_product_version,
       mapping_state, mapping_method, confidence, distance_km,
       effective_from
     ) VALUES (
       $1, $2, '555555555', 'fixture-hydrology', '1',
       'MAPPED', 'MANUAL', 0.99, 0.1,
       '2026-09-01T00:00:00Z'
     )`,
    [reach.rows[0]!.id, providerId],
  );

  repository = new HydrologyRepository(pool);
  adapter = new FixtureHydrologyAdapter({
    context: {
      providerId,
      providerKey: 'hydrology-repository-provider',
      capabilities: [
        'hydrology.dischargeForecast',
        'hydrology.returnPeriods',
      ],
      secretRef: null,
    },
    sourceId: 'hydrology-repository-fixture',
    attributionText: 'Hydrology repository fixture',
    attributionUrl: null,
    now: () => new Date('2026-09-18T00:00:00Z'),
  });
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM hydrology_forecast_runs
     WHERE provider_config_id = $1`,
    [providerId],
  );
  await pool.query(
    `DELETE FROM river_reach_provider_mappings
     WHERE provider_config_id = $1`,
    [providerId],
  );
  await pool.query(
    `DELETE FROM river_reaches
     WHERE public_id = 'reach:hydrology-repository'`,
  );
  await pool.query(
    `DELETE FROM rivers
     WHERE public_id = 'river:hydrology-repository'`,
  );
  await pool.query(
    `DELETE FROM basins
     WHERE public_id = 'basin:hydrology-repository'`,
  );
  await pool.query(
    `DELETE FROM provider_configs WHERE id = $1`,
    [providerId],
  );
  await pool.query(
    `DELETE FROM data_sources
     WHERE source_key = 'hydrology-repository-fixture'`,
  );
  await pool.end();
});

describe('HydrologyRepository', () => {
  it('persists forecast bundles idempotently and reconstructs compatible LKG', async () => {
    const bundle = await adapter.fetchHydrology({
      capability: 'hydrology.dischargeForecast',
      riverReachId: 'reach:hydrology-repository',
      providerReachId: '555555555',
      days: 1,
    });

    const firstRunId = await repository.saveBundle(
      providerId,
      bundle,
      '2026-09-18T01:00:00Z',
    );
    const secondRunId = await repository.saveBundle(
      providerId,
      bundle,
      '2026-09-18T01:00:00Z',
    );

    expect(secondRunId).toBe(firstRunId);

    const counts = await pool.query<{ runs: string; points: string }>(
      `SELECT
         (SELECT count(*)::text
          FROM hydrology_forecast_runs
          WHERE provider_config_id = $1
            AND capability = 'hydrology.dischargeForecast') AS runs,
         (SELECT count(*)::text
          FROM hydrology_discharge_points p
          JOIN hydrology_forecast_runs r ON r.id = p.hydrology_run_id
          WHERE r.provider_config_id = $1
            AND r.capability = 'hydrology.dischargeForecast') AS points`,
      [providerId],
    );
    expect(counts.rows[0]).toEqual({
      runs: '1',
      points: String(bundle.records.length),
    });

    const cached = await repository.findLastKnownGood({
      riverReachPublicId: 'reach:hydrology-repository',
      capability: 'hydrology.dischargeForecast',
      atUtc: '2026-09-18T02:00:00Z',
      staleGraceSeconds: 7200,
    });

    expect(cached).toMatchObject({
      runId: firstRunId,
      providerConfigId: providerId,
      providerReachId: '555555555',
      freshnessSeconds: 3600,
      staleAfterUtc: '2026-09-18T01:00:00Z',
      mapping: {
        state: 'MAPPED',
        selectedProviderReachId: '555555555',
      },
      bundle: {
        capability: 'hydrology.dischargeForecast',
      },
    });
    expect(cached?.bundle.records).toEqual(bundle.records);
  });

  it('persists return-period thresholds idempotently without inventing probability', async () => {
    const bundle = await adapter.fetchReturnPeriods({
      riverReachId: 'reach:hydrology-repository',
      providerReachId: '555555555',
    });

    const firstRunId = await repository.saveReturnPeriods(
      providerId,
      bundle,
      '2026-09-18T12:00:00Z',
    );
    const secondRunId = await repository.saveReturnPeriods(
      providerId,
      bundle,
      '2026-09-18T12:00:00Z',
    );
    expect(secondRunId).toBe(firstRunId);

    const rows = await pool.query<{ return_period_years: number }>(
      `SELECT rp.return_period_years
       FROM hydrology_return_periods rp
       JOIN hydrology_forecast_runs r ON r.id = rp.hydrology_run_id
       WHERE r.id = $1
       ORDER BY rp.return_period_years`,
      [firstRunId],
    );
    expect(rows.rows.map((row) => row.return_period_years)).toEqual([
      2, 5, 10, 20, 50, 100,
    ]);

    const cached = await repository.findLastKnownGood({
      riverReachPublicId: 'reach:hydrology-repository',
      capability: 'hydrology.returnPeriods',
      atUtc: '2026-09-18T06:00:00Z',
      staleGraceSeconds: 86_400,
    });
    expect(cached?.bundle.capability).toBe('hydrology.returnPeriods');
    expect(JSON.stringify(cached?.bundle)).not.toContain('probability');
  });

  it('refuses LKG after the persisted provider mapping is no longer current', async () => {
    await pool.query(
      `UPDATE river_reach_provider_mappings
       SET effective_to = '2026-09-18T03:00:00Z'
       WHERE provider_config_id = $1
         AND provider_reach_id = '555555555'`,
      [providerId],
    );

    const cached = await repository.findLastKnownGood({
      riverReachPublicId: 'reach:hydrology-repository',
      capability: 'hydrology.dischargeForecast',
      atUtc: '2026-09-18T04:00:00Z',
      staleGraceSeconds: 86_400,
    });
    expect(cached).toBeNull();
  });
});
