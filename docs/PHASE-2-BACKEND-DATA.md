# Phase 2 — Backend & Data Platform Execution Plan

Parent epic: #24

## Objective

Build a provenance-first backend around the deterministic Phase 1 packages without moving database/network/framework concerns into core calculation code.

## Work lanes

### Lane A — API foundation
- #25 NestJS/Fastify service, typed config, health/readiness, problem details, OpenAPI and CI.

### Lane B — Infrastructure, parallel after #25
- #26 PostgreSQL/PostGIS schema and migrations.
- #27 Redis/BullMQ queue and job contracts.

These lanes may progress in parallel once #25 establishes service/package/config conventions.

### Lane C — Ingestion
- #28 depends on #26 + #27.
- Preserve raw payload identity/checksum before normalization.
- Store parser/normalizer version, quality flags and import-run lifecycle.
- Enforce idempotent replay at both application and database boundaries.

### Lane D — Consumers
- #29 public read APIs depend on normalized storage/ingestion.
- #30 admin auth/RBAC/audit depends on API + database foundation and can overlap late #28 work where boundaries do not conflict.

### Exit gate
- #31 runs real PostGIS + Redis integration from a clean checkout and proves migration, queue/ingest, idempotent replay, provenance API and admin security smoke paths.

## Agent context rule

Load only the issue body plus the relevant directories:
- #25: `services/api`, root TS/pnpm/CI config.
- #26: database/migration area, shared contracts and `docs/DATA-SOURCES.md`/architecture notes.
- #27: worker/queue area and shared contracts.
- #28: source adapter/ingestion area + database/queue contracts.
- #29: API modules + public DTO contracts + relevant Phase 1 core package public APIs.
- #30: API admin/auth + audit persistence only.

Do not load mobile/web/admin UI code for Phase 2 backend tasks unless a concrete contract requires it.

## Invariants

1. Provenance is data, not prose: normalized records must link to import/source/raw identity.
2. Datum/unit/timezone/freshness are explicit and never guessed.
3. Same source payload replay is idempotent.
4. Core formulas stay in `packages/*`; services orchestrate them.
5. No production secret/default credential is committed.
6. CI must include integration infrastructure only for tests that actually require it; unit tests remain fast and isolated.

## Definition of done

Phase 2 is complete only when #31 records fresh CI evidence for an empty-database migration, one end-to-end fixture import, duplicate replay, provenance-bearing API response, OpenAPI generation, queue behavior and admin auth/audit smoke coverage.
