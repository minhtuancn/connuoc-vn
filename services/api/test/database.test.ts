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
