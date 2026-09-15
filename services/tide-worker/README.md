# Tide Worker

Background worker boundary for source ingestion and later tide prediction generation.

## Phase 2 ingestion responsibilities

- Read approved source adapters without putting network/database code into core engines.
- Preserve exact raw-payload identity with SHA-256 and source-specific payload keys.
- Parse, normalize and validate source records before normalized writes.
- Record adapter/parser/normalizer versions on import runs.
- Persist station/observation provenance through source, import-run and raw-payload foreign keys.
- Use database constraints plus deterministic import keys for idempotent replay.
- Classify bad source data as permanent and infrastructure failures as retryable through `@connuoc/job-queue`.
- Preserve rejected-import diagnostics/dead-letter metadata without committing partial normalized state.

## Transaction boundary

Raw payload archival happens before normalized writes. Station upsert, observations and the successful import-run transition happen in one PostgreSQL transaction guarded by an advisory lock on the import idempotency key. A repeated successful payload is returned as `duplicate` without creating observation rows.

## Fixture integration gate

`data/fixtures/ingestion/water-level-valid.json` is the canonical offline source fixture for #28. The dedicated ingestion workflow imports it twice against clean PostGIS and verifies replay idempotency plus source/import/raw provenance joins. The invalid fixture proves rejected raw payloads retain diagnostics while no invalid station/observation rows are committed.

## Future responsibilities

- Import approved harmonic/station datasets from reviewed live adapters.
- Generate versioned tide predictions and extrema.
- Persist forecast runs/points.
- Publish cache invalidation/update events.
- Emit source freshness/quality metrics.

Jobs must remain idempotent and traceable to source/model/parser versions.
