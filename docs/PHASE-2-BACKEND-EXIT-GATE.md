# Phase 2 Backend/Data Platform Exit Gate

Issue: #31

## Purpose

This gate proves the Phase 2 backend/data platform as one clean-checkout data flow rather than as isolated component tests.

The authoritative CI lane is `.github/workflows/phase2-exit-gate.yml`. It starts repository-pinned PostgreSQL/PostGIS and Redis services, installs from the frozen lockfile, migrates an empty database, verifies schema constraints, then runs `@connuoc/api`'s `phase2-exit.e2e.test.ts`.

## End-to-end data flow

1. Load the repository-owned synthetic water-level fixture.
2. Enqueue a `source-ingestion.v1` job through real Redis/BullMQ.
3. Process it with the production `handleSourceIngestionJob` processor and `PgIngestionRepository`.
4. Enqueue a second queue job that reads the same raw fixture.
5. Prove content-level replay idempotency: one raw payload, one successful import, two observations, and zero additional observations on replay.
6. Attach a deterministic synthetic harmonic tide model to the source/import provenance created by ingestion.
7. Start the production NestJS/Fastify API application against the same PostGIS database.
8. Query the queue-ingested station and tide endpoints and prove responses identify source, import run, raw SHA-256, parser/normalizer version, datum, and tide-model version as applicable.
9. Generate OpenAPI and verify the public station/tide and administrative source paths are present.
10. Seed runtime-only admin viewer/operator credentials as SHA-256 token digests.
11. Prove anonymous admin access is denied, viewer mutation is forbidden, operator mutation succeeds, and the mutation appends a correlated before/after audit record.
12. Emit `phase2-exit-evidence.json` as a GitHub Actions artifact.

## Test inventory

| Area | Evidence |
| --- | --- |
| Frozen dependency graph | `pnpm install --frozen-lockfile` |
| Empty database bootstrap | `pnpm --filter @connuoc/api db:migrate` |
| PostGIS/schema constraints | `pnpm --filter @connuoc/api db:smoke` |
| Redis/BullMQ path | real `source-ingestion.v1` Queue, QueueEvents and Worker |
| Production ingestion processor | `handleSourceIngestionJob` |
| Raw-content idempotency | second queue job reads the same fixture; observation count remains 2 |
| Ingestion provenance | source/import/raw checksum/parser/normalizer joins |
| Public API | station and tide requests against the same ingested database |
| Deterministic tide calculation | `@connuoc/tide-engine` via the public API service |
| OpenAPI | generated from the production application module graph |
| Admin auth/RBAC | anonymous 401, viewer mutation 403, operator mutation 200 |
| Audit | one correlated append-only mutation record with before/after state |
| Machine-readable evidence | `phase2-backend-exit-evidence` workflow artifact |

The existing `CI`, `Queue Integration`, `Ingestion Integration`, `Public API Integration`, and `Admin Integration` workflows remain narrower regression lanes. The Phase 2 exit gate complements rather than replaces them.

## Provenance contract checked by the exit gate

For the fixture station, the gate requires traceability to:

- source key `fixture-water-level`;
- a successful source import run;
- the exact raw-payload SHA-256 checksum;
- parser version `fixture-parser-v1`;
- normalizer version `water-level-normalizer-v1`;
- datum `local-gauge-fixture`;
- harmonic model id `phase2-exit-harmonic`;
- harmonic model version `phase2-exit-v1`.

## Security and repository hygiene

- The fixture is synthetic and repository-owned; no proprietary raw provider payload is required by this gate.
- Admin test bearer strings are synthetic test values only. PostgreSQL persists only their SHA-256 digests.
- No production credential or default production administrator is introduced.
- Existing CI continues to reject committed local environment files.

## Known limitations

- Redis/BullMQ is real, but the test Worker runs in the same test process rather than as a separately deployed worker container/process. Deployment topology belongs to a later deployment/reliability gate.
- The fixture source contains observed water levels, not harmonic constituents. The exit test therefore attaches a deterministic synthetic harmonic model to the successful ingestion provenance before exercising `/tide`.
- The gate proves the repository's synthetic source adapter and data contracts, not availability, licensing, or schema stability of any future live external provider.
- The gate is backend/data-platform evidence only. Mobile/web UX, offline synchronization, alert delivery, production monitoring, backups, and load/SLO qualification are outside #31.

## Exit decision

Phase 2 backend/data platform can be marked complete only when a fresh PR merge-ref run of this workflow is green together with the normal CI/regression lanes, and the generated evidence shows no duplicate observations on replay and complete source/import/raw/model traceability.
