# Phase 2 Ingestion E2E Design

Issue: #28

## Goal

Implement one provenance-first source ingestion path that can read a repository fixture, archive the exact raw payload identity, parse/normalize/validate records, persist canonical station/observation rows transactionally, replay idempotently, and preserve actionable failure/dead-letter diagnostics.

## Boundaries

### Source adapter

A source adapter owns source-specific reading and parsing only. It exposes stable versions for adapter, parser, and normalizer. The first adapter reads a checked-in JSON fixture; #28 intentionally does not add a live network source.

### Canonical normalized batch

Adapters normalize into a transport-neutral batch containing one canonical station and zero or more water-level observations. Shared schemas validate ISO timestamps, coordinates, station type, units, datum identifiers, and entity identifiers before storage.

### Persistence/orchestration

The worker persistence layer owns PostgreSQL transactions and maps canonical public IDs to database UUIDs. It does not put SQL concerns into deterministic core packages.

## Raw archive and import lifecycle

1. Upsert the `data_sources` row by `source_key`.
2. Compute SHA-256 from the exact raw bytes.
3. Insert `raw_payloads` using source + payload key/checksum uniqueness. A repeated raw payload resolves to the existing row.
4. Derive an import idempotency key from source key, raw checksum, parser version, and normalizer version.
5. If the matching import run already `SUCCEEDED`, return `duplicate` without touching normalized rows.
6. Parse/normalize/validate before opening the normalized write transaction.
7. In one transaction, create/reset the import run to `RUNNING`, upsert station metadata, insert observations, attach provenance IDs, then mark the run `SUCCEEDED`.
8. Observation insertion relies on the database unique constraint `(source_id, source_record_key)` as the final idempotency guard.

Raw archival is deliberately separate from normalized writes. Therefore bad source data can remain diagnosable while normalized state stays atomic.

## Failure model

Parse/schema/unsupported-value failures are permanent source-data failures. The worker persists a `FAILED` or `REJECTED` import run with `error_summary` and a BullMQ v1 dead-letter envelope in `metadata`; no station/observation writes from that attempt commit.

Database/network/runtime infrastructure failures remain retryable and use the #27 error classification. A dead-letter envelope is created only when the caller decides attempts are exhausted; the shared #27 contract remains the source of truth for queue failure shape.

## Fixture

The valid fixture contains one tide/water-level station and multiple observations with explicit UTC timestamps, unit, datum, source record key, coordinates and timezone. An invalid fixture exercises permanent validation failure and atomic rollback.

## Tests and gates

Unit tests cover deterministic raw checksum/idempotency-key derivation, fixture parsing/normalization, and permanent-vs-retryable classification.

A dedicated PostGIS integration workflow starts a clean database, runs the existing migrations, imports the valid fixture twice, and asserts:
- the second import is reported as duplicate,
- exactly one raw payload/import run/station set exists for the fixture,
- observation count is unchanged after replay,
- every observation joins back to source/import/raw checksum,
- importing the invalid fixture leaves zero partial normalized rows for its source while retaining raw/import failure diagnostics.

## Non-goals

- No live HTTP source adapters.
- No object-store upload implementation; `storage_uri` records fixture/source references only.
- No forecast generation.
- No public API endpoints; those belong to #29.
- No admin mutation UI/auth; those belong to #30.
