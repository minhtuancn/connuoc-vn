# Database Infrastructure

PostgreSQL + PostGIS schema/migration support for the backend data platform.

## Version baseline

Phase 2 CI/local development uses `postgis/postgis:18-3.6`. Production may use a managed PostgreSQL/PostGIS service with compatible major versions after staging verification.

## Migration model

Versioned SQL lives under `infrastructure/database/migrations/`.

`services/api/scripts/migrate.mjs`:
- requires explicit `DATABASE_URL`,
- creates `schema_migrations`,
- serializes migration execution with a PostgreSQL advisory lock,
- stores SHA-256 of each applied migration,
- fails on checksum drift if an already-applied migration file is later edited,
- applies each new migration transactionally.

Applied migrations are immutable. Do **not** edit an applied migration to roll back production. Corrective schema changes use a new forward migration. Destructive rollback requires an explicit operator runbook/backup restore because automatically reversing data migrations is not generally safe.

## Phase 2 core schema

The first migration creates:
- source metadata,
- raw payload identity/checksum,
- import runs with parser/normalizer versions,
- basin/river/estuary/station geometry,
- station aliases,
- water-level observations,
- forecast runs/points,
- quality flags,
- append-only audit log.

Datum/unit/source/import/raw-payload references are stored explicitly where relevant.

### Idempotency boundaries

- `raw_payloads (source_id, payload_key)` is unique.
- `raw_payloads (source_id, checksum_sha256)` is unique to reject replayed source content.
- `source_import_runs.idempotency_key` is unique.
- `observations (source_id, source_record_key)` is unique.

The ingestion layer must still choose stable source-specific keys; database constraints are the final guard, not the only idempotency mechanism.

## Time-series partition decision

Phase 2 starts with an unpartitioned `observations` table plus `(station_id, observed_at DESC)` and provenance indexes. This is intentional: the architecture allows monthly partitioning, but partitioning is deferred until observed row volume/query plans justify the operational complexity. A later migration can partition new/high-volume data without pretending an evidence-free threshold today.

## Spatial indexes

GIST indexes are created for station points and basin/river/estuary geometries. CI executes a real `ST_DWithin` smoke query after migrating an empty PostGIS database.

## Local development

```bash
docker compose -f infrastructure/docker/compose.postgis.yml up -d
export DATABASE_URL='postgresql://connuoc:connuoc-local-only@localhost:5432/connuoc'
pnpm --filter @connuoc/api db:migrate
pnpm --filter @connuoc/api db:smoke
```

The default compose password is intentionally local-only and must never be reused for staging/production.
