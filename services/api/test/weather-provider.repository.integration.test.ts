import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WeatherProviderRepository } from '../src/modules/weather/weather-provider.repository.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for weather provider repository integration tests');
}

const pool = new Pool({
  connectionString: databaseUrl,
  application_name: 'weather-provider-repository-integration',
});

let repository: WeatherProviderRepository;
let preferredProviderId: string;

async function seed(): Promise<void> {
  await pool.query(`TRUNCATE TABLE
    provider_health_events,
    provider_capabilities,
    provider_configs,
    data_sources
    RESTART IDENTITY CASCADE`);

  const preferredSource = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('open-meteo-paid-hosted', 'Open-Meteo Paid Hosted', 'weather_api') RETURNING id`,
  );
  const outsideSource = await pool.query<{ id: string }>(
    `INSERT INTO data_sources (source_key, name, source_type)
     VALUES ('weather-outside', 'Weather Outside', 'weather_api') RETURNING id`,
  );

  const preferred = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       secret_ref, endpoint_config, commercial_use_status, redistribution_status,
       licence_status, attribution_text, attribution_url, coverage,
       freshness_policy, model_allow_list, health_state, health_blocks_selection
     ) VALUES (
       'open-meteo-paid', $1, 'open-meteo', true, 100, 2,
       'env://OPEN_METEO_API_KEY',
       '{"baseUrl":"https://customer-api.open-meteo.com/v1/forecast","timeoutMs":5000}'::jsonb,
       'ALLOWED', 'ATTRIBUTION_REQUIRED', 'REVIEWED', 'Open-Meteo', 'https://open-meteo.com/',
       ST_Multi(ST_GeomFromText('POLYGON((105 19,106 19,106 20,105 20,105 19))', 4326)),
       '{"maxAgeSeconds":600}'::jsonb,
       '["ecmwf_ifs025"]'::jsonb,
       'HEALTHY', false
     ) RETURNING id`,
    [preferredSource.rows[0]!.id],
  );
  preferredProviderId = preferred.rows[0]!.id;

  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES ($1, 'weather.current', true), ($1, 'weather.hourlyForecast', true)`,
    [preferredProviderId],
  );

  const outside = await pool.query<{ id: string }>(
    `INSERT INTO provider_configs (
       provider_key, data_source_id, provider_type, enabled, priority, weight,
       commercial_use_status, redistribution_status, licence_status,
       attribution_text, coverage, freshness_policy, model_allow_list,
       health_state, health_blocks_selection
     ) VALUES (
       'outside-provider', $1, 'fixture', true, 200, 1,
       'ALLOWED', 'ALLOWED', 'REVIEWED', 'Outside fixture',
       ST_Multi(ST_GeomFromText('POLYGON((110 10,111 10,111 11,110 11,110 10))', 4326)),
       '{}'::jsonb, '[]'::jsonb, 'DEGRADED', true
     ) RETURNING id`,
    [outsideSource.rows[0]!.id],
  );
  await pool.query(
    `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
     VALUES ($1, 'weather.current', true)`,
    [outside.rows[0]!.id],
  );
}

beforeAll(async () => {
  await seed();
  repository = new WeatherProviderRepository(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('weather runtime provider repository', () => {
  it('loads internal runtime config with spatial eligibility and stable source ids', async () => {
    const providers = await repository.listRuntimeProviders({ latitude: 19.5, longitude: 105.5 });

    const preferred = providers.find((item) => item.providerId === preferredProviderId);
    expect(preferred).toMatchObject({
      providerKey: 'open-meteo-paid',
      providerType: 'open-meteo',
      sourceRegistryId: 'open-meteo-paid-hosted',
      endpointConfig: {
        baseUrl: 'https://customer-api.open-meteo.com/v1/forecast',
        timeoutMs: 5000,
      },
      secretRef: 'env://OPEN_METEO_API_KEY',
      modelAllowList: ['ecmwf_ifs025'],
      freshnessSeconds: 600,
      attribution: { text: 'Open-Meteo', url: 'https://open-meteo.com/' },
      selectable: {
        enabled: true,
        priority: 100,
        weight: 2,
        capabilities: ['weather.current', 'weather.hourlyForecast'],
        coversLocation: true,
        commercialUseStatus: 'ALLOWED',
        healthState: 'HEALTHY',
        healthBlocksSelection: false,
        quotaAvailable: true,
        budgetAvailable: true,
        effectiveFromUtc: null,
        effectiveToUtc: null,
      },
    });

    const outside = providers.find((item) => item.providerKey === 'outside-provider');
    expect(outside?.selectable.coversLocation).toBe(false);
    expect(outside?.selectable.healthBlocksSelection).toBe(true);
  });

  it('records bounded health evidence without arbitrary upstream bodies', async () => {
    await repository.recordHealthEvent(
      preferredProviderId,
      'DEGRADED',
      123,
      'HTTP_RETRYABLE',
    );

    const result = await pool.query<{
      state: string;
      latency_ms: number;
      failure_code: string | null;
      details: Record<string, unknown>;
    }>(
      `SELECT state, latency_ms, failure_code, details
       FROM provider_health_events
       WHERE provider_config_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [preferredProviderId],
    );

    expect(result.rows[0]).toEqual({
      state: 'DEGRADED',
      latency_ms: 123,
      failure_code: 'HTTP_RETRYABLE',
      details: {},
    });
  });
});
