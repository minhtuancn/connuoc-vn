import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parseDatabaseEnvironment } from '../src/database/config.js';

describe('database environment', () => {
  it('requires an explicit PostgreSQL connection URL', () => {
    expect(() => parseDatabaseEnvironment({})).toThrow();
    expect(() => parseDatabaseEnvironment({ DATABASE_URL: 'https://example.com/database' })).toThrow();
  });

  it('parses PostgreSQL URL and bounded pool size', () => {
    expect(parseDatabaseEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/connuoc',
      DB_POOL_MAX: '12',
    })).toEqual({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/connuoc',
      DB_POOL_MAX: 12,
    });

    expect(() => parseDatabaseEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/connuoc',
      DB_POOL_MAX: '0',
    })).toThrow();
  });
});

describe('weather/provider foundation migration', () => {
  it('keeps provider credentials reference-only and defines the required foundation tables', async () => {
    const testDirectory = dirname(fileURLToPath(import.meta.url));
    const migration = await readFile(
      resolve(
        testDirectory,
        '../../../infrastructure/database/migrations/0004_weather_provider_foundation.sql',
      ),
      'utf8',
    );

    expect(migration).toContain('CREATE TABLE administrative_areas');
    expect(migration).toContain('CREATE TABLE provider_configs');
    expect(migration).toContain('CREATE TABLE provider_capabilities');
    expect(migration).toContain('CREATE TABLE provider_health_events');
    expect(migration).toContain('secret_ref text');
    expect(migration).toContain('administrative_areas_historical_not_current');
    expect(migration).not.toMatch(/\b(api_key|apikey|password|secret_value)\b\s+text/i);
  });
});
