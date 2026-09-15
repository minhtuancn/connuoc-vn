import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for database migrations.');
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = resolve(scriptDirectory, '../../../infrastructure/database/migrations');
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort((left, right) => left.localeCompare(right));

const client = new Client({ connectionString: databaseUrl, application_name: 'connuoc-migrator' });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name text PRIMARY KEY,
      checksum_sha256 char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await client.query("SELECT pg_advisory_lock(hashtext('connuoc-schema-migrations'))");

  for (const migrationName of migrationFiles) {
    const sql = await readFile(resolve(migrationsDirectory, migrationName), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const applied = await client.query(
      'SELECT checksum_sha256 FROM schema_migrations WHERE migration_name = $1',
      [migrationName],
    );

    if (applied.rowCount === 1) {
      if (applied.rows[0].checksum_sha256 !== checksum) {
        throw new Error(`Migration drift detected for ${migrationName}. Applied checksum differs from repository.`);
      }
      console.log(`skip ${migrationName} (already applied)`);
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (migration_name, checksum_sha256) VALUES ($1, $2)',
        [migrationName, checksum],
      );
      await client.query('COMMIT');
      console.log(`applied ${migrationName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  try {
    await client.query("SELECT pg_advisory_unlock(hashtext('connuoc-schema-migrations'))");
  } catch {
    // Connection/migration failures may make unlock unavailable; session close releases the lock.
  }
  await client.end();
}
