import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for database smoke tests.');
}

const client = new Client({ connectionString: databaseUrl, application_name: 'connuoc-db-smoke' });
await client.connect();

try {
  const postgis = await client.query('SELECT PostGIS_Version() AS version');
  if (!postgis.rows[0]?.version) {
    throw new Error('PostGIS extension is not available after migrations.');
  }

  const expectedTables = [
    'data_sources',
    'raw_payloads',
    'source_import_runs',
    'stations',
    'observations',
    'forecast_runs',
    'forecast_points',
    'quality_flags',
    'audit_log',
  ];
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [expectedTables],
  );
  if (tables.rowCount !== expectedTables.length) {
    throw new Error(`Expected ${expectedTables.length} core tables, found ${tables.rowCount ?? 0}.`);
  }

  await client.query('BEGIN');
  try {
    const source = await client.query(
      `INSERT INTO data_sources (source_key, name, source_type)
       VALUES ('ci-fixture', 'CI Fixture', 'fixture') RETURNING id`,
    );
    const sourceId = source.rows[0].id;

    const station = await client.query(
      `INSERT INTO stations (public_id, name, station_type, time_zone, location)
       VALUES (
         'ci-station',
         'CI Station',
         'water_level',
         'Asia/Ho_Chi_Minh',
         ST_SetSRID(ST_MakePoint(105.83, 21.03), 4326)
       ) RETURNING id`,
    );
    const stationId = station.rows[0].id;

    const nearby = await client.query(
      `SELECT public_id
       FROM stations
       WHERE id = $1
         AND ST_DWithin(
           location::geography,
           ST_SetSRID(ST_MakePoint(105.831, 21.031), 4326)::geography,
           500
         )`,
      [stationId],
    );
    if (nearby.rowCount !== 1 || nearby.rows[0].public_id !== 'ci-station') {
      throw new Error('PostGIS spatial proximity query did not return the fixture station.');
    }

    const checksum = 'a'.repeat(64);
    await client.query(
      `INSERT INTO raw_payloads
        (source_id, payload_key, checksum_sha256, captured_at, byte_length)
       VALUES ($1, 'fixture:2026-09-15', $2, now(), 128)`,
      [sourceId, checksum],
    );

    await client.query('SAVEPOINT duplicate_payload');
    let duplicateRejected = false;
    try {
      await client.query(
        `INSERT INTO raw_payloads
          (source_id, payload_key, checksum_sha256, captured_at, byte_length)
         VALUES ($1, 'fixture:2026-09-15-duplicate-key', $2, now(), 128)`,
        [sourceId, checksum],
      );
    } catch (error) {
      duplicateRejected = error && typeof error === 'object' && 'code' in error && error.code === '23505';
      await client.query('ROLLBACK TO SAVEPOINT duplicate_payload');
    }
    if (!duplicateRejected) {
      throw new Error('Raw payload checksum uniqueness did not reject duplicate source content.');
    }

    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  console.log(JSON.stringify({
    status: 'ok',
    postgisVersion: postgis.rows[0].version,
    checkedTables: expectedTables.length,
    checks: ['empty-db-migration', 'spatial-query', 'raw-payload-idempotency-constraint'],
  }));
} finally {
  await client.end();
}
