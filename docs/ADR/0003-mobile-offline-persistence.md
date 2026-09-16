# ADR-0003: Mobile Offline Persistence with Drift

- Status: Accepted for Phase 3 issue #42
- Date: 2026-09-16
- Parent: #39
- Depends on: #40, #41

## Decision

Use Drift over SQLite for the Flutter application's Phase 3 local persistence boundary.

The application-facing `PublicDataRepository` remains unchanged. A cached decorator composes the existing HTTP repository with a typed Drift-backed cache store. Favorites, preferences, sync state and offline-pack persistence use separate focused repositories/stores.

## Key consequences

- widgets and controllers do not import SQLite/Drift;
- cache entries preserve provenance, datum, unit, timezone, generated/observed/fetched timestamps and HTTP freshness metadata;
- stale/expired cached values retain their original fetch time and are never relabeled as live;
- failed refreshes preserve last-known-good data;
- offline dataset replacement is atomic and writes the manifest last;
- schema migrations are versioned and tested; destructive fallback is not accepted;
- no admin token, user-account secret or duplicated tide/lunar/drainage calculation is stored or implemented here.

## Dependency policy

For this issue, pin:

- `drift` `2.35.0`
- `drift_flutter` `0.3.1`
- `drift_dev` `2.35.0`
- `build_runner` `2.16.1`

Generated Drift code and schema snapshots are committed and verified deterministically in CI.

## Detailed design

See `docs/superpowers/specs/2026-09-16-mobile-offline-persistence-design.md`.
