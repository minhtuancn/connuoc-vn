# Phase 2 Ingestion E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fixture-backed, provenance-first ingestion path with transactional normalized writes, replay idempotency, and persistent failure diagnostics.

**Architecture:** `services/tide-worker` owns adapters/orchestration/repositories. Source-specific adapters produce a canonical normalized batch; PostgreSQL maps public IDs to UUIDs and provides final idempotency constraints. `@connuoc/job-queue` supplies source-ingestion/dead-letter contracts and error classification.

**Tech Stack:** Node 24, TypeScript 6, Vitest 5, PostgreSQL/PostGIS, `pg` 8.23.0, Zod 4.6.5, `@connuoc/shared-types`, `@connuoc/job-queue`.

**Spec:** `docs/superpowers/specs/2026-09-15-ingestion-e2e-design.md`

## Global Constraints

- Do not add a live network source in #28.
- Preserve raw payload checksum/source identity before normalized writes.
- Database constraints remain the final idempotency guard.
- Do not import Redis/BullMQ or PostgreSQL into deterministic core engines.
- Parse/schema failures are permanent; infrastructure failures are retryable.
- A failed normalized transaction must not leave partial station/observation writes.

---

### Task 1: Tide worker package and fixture adapter

**Files:**
- Create: `services/tide-worker/package.json`
- Create: `services/tide-worker/tsconfig.json`
- Create: `services/tide-worker/src/contracts.ts`
- Create: `services/tide-worker/src/fixture-adapter.ts`
- Create: `services/tide-worker/src/identity.ts`
- Create: `services/tide-worker/test/fixture-adapter.test.ts`
- Create: `data/fixtures/ingestion/water-level-valid.json`
- Create: `data/fixtures/ingestion/water-level-invalid.json`

**Interfaces:**
- Produces `RawSourcePayload`, `NormalizedImportBatch`, `SourceAdapter`, `FixtureWaterLevelAdapter`, `sha256Hex`, `importIdempotencyKey`.

- [ ] Write fixture/identity tests first: exact bytes yield stable SHA-256; valid fixture normalizes station + observations; invalid unit/timestamp is rejected.
- [ ] Run the targeted worker unit test and confirm RED.
- [ ] Implement the minimal contracts/adapter/identity functions.
- [ ] Run targeted tests and confirm GREEN.
- [ ] Commit.

### Task 2: PostgreSQL ingestion repository and lifecycle

**Files:**
- Create: `services/tide-worker/src/repository.ts`
- Create: `services/tide-worker/src/ingest.ts`
- Create: `services/tide-worker/test/ingest.unit.test.ts`

**Interfaces:**
- Consumes `SourceAdapter` and canonical batches from Task 1.
- Produces `ingestSourcePayload(pool, adapter, raw): Promise<IngestionResult>` with `status: 'imported' | 'duplicate' | 'failed'`.

- [ ] Write tests for duplicate short-circuit, permanent validation classification, and no normalized transaction before validation.
- [ ] Confirm RED.
- [ ] Implement source upsert/raw archival/import-run lifecycle and normalized transaction.
- [ ] Persist parser/normalizer versions and source/raw/import IDs on observations.
- [ ] Persist failed import diagnostics without partial normalized writes.
- [ ] Confirm unit tests GREEN.
- [ ] Commit.

### Task 3: Queue failure/dead-letter bridge

**Files:**
- Create: `services/tide-worker/src/job-handler.ts`
- Create: `services/tide-worker/test/job-handler.test.ts`
- Modify: `services/tide-worker/src/index.ts`

**Interfaces:**
- Consumes `SourceIngestionJobSchema`, `PermanentJobError`, `RetryableJobError`, `buildDeadLetterEnvelope` from `@connuoc/job-queue`.
- Produces source job validation/error mapping helpers and dead-letter metadata for exhausted failures.

- [ ] Write tests proving source-data validation maps permanent while unknown/database failures remain retryable.
- [ ] Confirm RED.
- [ ] Implement minimal mapping/dead-letter helpers.
- [ ] Confirm GREEN.
- [ ] Commit.

### Task 4: Real PostGIS replay/failure integration gate

**Files:**
- Create: `services/tide-worker/test/ingestion.integration.test.ts`
- Create: `.github/workflows/ingestion-integration.yml`
- Modify: `services/tide-worker/package.json`
- Modify: `services/tide-worker/README.md`

**Interfaces:**
- Executes the real migrations and worker against PostGIS.

- [ ] Write integration assertions for valid import, duplicate replay, provenance joins, and invalid-fixture atomic failure.
- [ ] Run integration workflow and observe failures before production path is complete.
- [ ] Fix only behavior exposed by those assertions.
- [ ] Verify unit + integration + root CI all GREEN.
- [ ] Commit.

### Task 5: PR and merge gate

- [ ] Open draft PR linked to #28.
- [ ] Verify final head with frozen install, lint, typecheck, unit tests, build, tide benchmark, PostGIS migration smoke, Redis/BullMQ smoke, and ingestion integration.
- [ ] Update PR with exact run evidence.
- [ ] Mark ready and merge only when all gates are green.
- [ ] Confirm #28 closed and update #24 dependency checklist.
