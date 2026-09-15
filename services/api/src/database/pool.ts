import { Pool } from 'pg';

import type { DatabaseEnvironment } from './config.js';

export function createDatabasePool(environment: DatabaseEnvironment): Pool {
  return new Pool({
    connectionString: environment.DATABASE_URL,
    max: environment.DB_POOL_MAX,
    application_name: 'connuoc-api',
  });
}
