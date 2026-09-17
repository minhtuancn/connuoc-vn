# Phase 5C Rainfall Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make rainfall a first-class hydrometeorological signal with normalized observed/estimated/forecast records, deterministic accumulation features, provenance-aware persistence, last-known-good behavior and vendor-neutral public APIs.

**Architecture:** Extend the existing provider platform and `weather-worker` package instead of creating a parallel provider stack. Rainfall gets its own shared domain contracts and API module, while provider selection, source/licence policy, secrets and health continue to use the Phase 5A/5B infrastructure. Large raster payloads remain outside transactional PostgreSQL; PostgreSQL stores normalized point/grid-cell metadata, provenance, checksums and object-storage references when applicable.

**Tech Stack:** TypeScript 6, Zod, NestJS, PostgreSQL 18 + PostGIS 3.6, Vitest 5, pnpm 12.4.1, existing provider selector/source policy, Open-Meteo adapter infrastructure, fixture-based IMERG normalization tests.

**Spec:** `docs/superpowers/specs/2026-09-17-weather-hydrology-intelligence-design.md`

## Global Constraints

- Observed, estimated, forecast, simulated and derived values remain explicitly distinct.
- Never label satellite/radar/model estimates as gauge observations.
- Preserve native valid-time, accumulation interval and spatial-resolution semantics.
- Derived accumulations retain source lineage and an explicit derivation version.
- Supported derived windows are exactly 1h, 3h, 6h, 12h, 24h, 72h and 7d where source resolution/coverage supports them.
- Provider credentials remain server-side; public rainfall responses expose no `providerKey`, `secretRef` or endpoint configuration.
- Provider enablement remains fail-closed for commercial/licence policy.
- Raw retention/redistribution follows the source registry policy; IMERG raster objects are referenced by object key/URI metadata rather than copied into giant transactional JSON blobs.
- No river-stage value, flood probability or flood-risk assessment is produced by Phase 5C.
- Exact request coordinates are used transiently for provider coverage/querying and are not persisted as user location history.
- All behavior changes follow RED → GREEN → REFACTOR; no production code is added before the failing test that requires it.

---

## File Structure

### Shared contracts
- Create `packages/shared-types/src/rainfall.ts`: Zod schemas and public rainfall types.
- Modify `packages/shared-types/src/index.ts`: export rainfall contracts.
- Create `packages/shared-types/test/rainfall.test.ts`: schema boundary and safety tests.

### Rainfall normalization / feature logic
- Create `services/weather-worker/src/rainfall-contracts.ts`: provider adapter request/bundle contracts.
- Create `services/weather-worker/src/rainfall-accumulation.ts`: deterministic accumulation engine.
- Create `services/weather-worker/src/rainfall-fixture.ts`: representative gauge/satellite/forecast fixture adapter.
- Create `services/weather-worker/src/open-meteo-rainfall.ts`: normalized hourly forecast-rain adapter reusing the existing HTTP client pattern.
- Create `services/weather-worker/src/imerg-normalizer.ts`: normalize extracted IMERG half-hour grid-cell payloads/manifests without coupling the core to Earthdata download/auth.
- Modify `services/weather-worker/src/index.ts`: export rainfall modules.
- Create tests under `services/weather-worker/test/` for accumulation, fixture normalization, Open-Meteo rainfall normalization and IMERG normalization.

### Persistence
- Create `infrastructure/database/migrations/0006_rainfall.sql`.
- Modify `services/api/scripts/db-smoke.mjs` for deterministic migration/table/constraint checks.
- Create `services/api/src/modules/rainfall/rainfall.repository.ts` for normalized run/record/derived-window persistence and nearest compatible last-known-good lookup.
- Create `services/api/test/rainfall.repository.integration.test.ts`.

### Runtime orchestration and API
- Create `services/api/src/modules/rainfall/rainfall-provider.repository.ts`: capability-filtered runtime provider view reusing provider config policy.
- Create `services/api/src/modules/rainfall/rainfall-adapter.factory.ts`.
- Create `services/api/src/modules/rainfall/rainfall-orchestrator.ts`.
- Create `services/api/src/modules/rainfall/rainfall.service.ts`.
- Create `services/api/src/modules/rainfall/rainfall.controller.ts`.
- Create `services/api/src/modules/rainfall/rainfall.module.ts`.
- Modify `services/api/src/app.module.ts` to register the rainfall module.
- Create `services/api/test/rainfall-api.integration.test.ts` and `services/api/test/phase5c-rainfall.integration.test.ts`.

### Documentation / CI
- Create `docs/PHASE-5C-RAINFALL.md`.
- Modify `docs/DATA-SOURCES.md` with IMERG/Open-Meteo rainfall operational notes and object-storage rules.
- Modify `docs/PROJECT-STATUS.md` and `docs/ROADMAP.md` only after the Phase 5C exit gate is actually green.
- Create `.github/workflows/phase5c-rainfall.yml`.

---

### Task 1: Shared rainfall domain contracts and deterministic accumulation engine

**Files:**
- Create: `packages/shared-types/src/rainfall.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/test/rainfall.test.ts`
- Create: `services/weather-worker/src/rainfall-contracts.ts`
- Create: `services/weather-worker/src/rainfall-accumulation.ts`
- Modify: `services/weather-worker/src/index.ts`
- Test: `services/weather-worker/test/rainfall-accumulation.test.ts`

**Interfaces:**
- Produces `RainfallProductKind`, `RainfallSpatialMetadata`, `RainfallSourceProvenance`, `RainfallRecord`, `RainfallAccumulation`, `RainfallSummaryResponse`, `RainfallHistoryResponse`, `RainfallForecastResponse`.
- Produces `RainfallAdapterRequest`, `NormalizedRainfallBundle`, `RainfallProviderAdapter`.
- Produces `deriveRainfallAccumulations(records, endUtc, windowsSeconds, derivationVersion)` returning windows with `amountMm`, `coverageRatio`, `complete`, `inputRecordIds`, `sourceIds` and `derivationVersion`.

- [ ] **Step 1: Write failing shared-type tests**

Add tests that require:

```ts
expect(RainfallRecordSchema.parse({
  id: 'rain:fixture:1',
  productKind: 'SATELLITE_ESTIMATE',
  validStart: '2026-09-17T01:30:00Z',
  validEnd: '2026-09-17T02:00:00Z',
  accumulationSeconds: 1800,
  amountMm: 4.2,
  unit: 'mm',
  spatial: {
    representation: 'GRID_CELL',
    latitude: 19.5,
    longitude: 105.5,
    resolutionKm: 10,
    stationId: null,
  },
  quality: { state: 'VALID', flags: [] },
  source: {
    sourceId: 'nasa-gpm-imerg',
    providerConfigId: null,
    productId: 'IMERG-Early',
    productVersion: 'V07B',
    modelRunAt: null,
    observedAt: '2026-09-17T02:00:00Z',
    fetchedAt: '2026-09-17T02:10:00Z',
    attributionText: 'NASA GPM IMERG',
    attributionUrl: 'https://gpm.nasa.gov/data/imerg',
  },
})).toBeDefined();
```

Also require schema rejection when `validEnd <= validStart`, `accumulationSeconds` does not match the valid interval, amount is negative, a `GAUGE_OBSERVATION` lacks `stationId`, or a non-gauge grid estimate is relabeled as a gauge observation.

- [ ] **Step 2: Run shared-type tests and verify RED**

Run:

```bash
pnpm --filter @connuoc/shared-types exec vitest run test/rainfall.test.ts
```

Expected: FAIL because `rainfall.ts` and the exported schemas do not exist.

- [ ] **Step 3: Implement the minimal shared rainfall schemas**

Create strict Zod schemas with these closed enums:

```ts
RainfallProductKind =
  | 'GAUGE_OBSERVATION'
  | 'RADAR_ESTIMATE'
  | 'SATELLITE_ESTIMATE'
  | 'REANALYSIS'
  | 'DETERMINISTIC_FORECAST'
  | 'ENSEMBLE_FORECAST'
  | 'BLENDED_DERIVED';

RainfallSpatialRepresentation = 'GAUGE' | 'POINT' | 'GRID_CELL' | 'BASIN_AGGREGATE';
RainfallQualityState = 'VALID' | 'ESTIMATED' | 'SUSPECT' | 'MISSING';
```

`RainfallRecordSchema` must enforce interval order and exact accumulation duration in seconds. A `GAUGE_OBSERVATION` must use `representation: 'GAUGE'` and a non-null station ID; non-gauge product kinds cannot use the GAUGE representation.

- [ ] **Step 4: Run shared-type tests and verify GREEN**

Run the Step 2 command and then:

```bash
pnpm --filter @connuoc/shared-types typecheck
```

Expected: all pass.

- [ ] **Step 5: Write failing accumulation tests**

Test the pure engine with consecutive half-hour records ending at `2026-09-17T03:00:00Z` and require:

```ts
const result = deriveRainfallAccumulations(records, '2026-09-17T03:00:00Z', [3600, 10800], 'rainfall-accum-v1');
expect(result[0]).toMatchObject({
  windowSeconds: 3600,
  amountMm: 3,
  coverageRatio: 1,
  complete: true,
  derivationVersion: 'rainfall-accum-v1',
});
```

Add tests for a missing 30-minute interval (`complete: false`, coverage ratio below 1), interval-boundary exclusion, mixed source lineage preservation and rejection of overlapping records for the same normalized series.

- [ ] **Step 6: Run accumulation tests and verify RED**

```bash
pnpm --filter @connuoc/weather-worker exec vitest run test/rainfall-accumulation.test.ts
```

Expected: FAIL because `deriveRainfallAccumulations` does not exist.

- [ ] **Step 7: Implement the minimal deterministic accumulation engine**

Rules:

```text
window = (endUtc - windowSeconds, endUtc]
include only records fully contained in the window
coverageSeconds = union of included non-overlapping valid intervals
coverageRatio = coverageSeconds / windowSeconds
complete = coverageRatio === 1
amountMm = sum(amountMm) only when every included record has quality != MISSING
```

Reject overlapping intervals in one normalized input series instead of double-counting. Preserve unique `record.id` and `source.sourceId` lineage in deterministic sorted arrays.

- [ ] **Step 8: Verify Task 1 GREEN**

```bash
pnpm --filter @connuoc/shared-types test
pnpm --filter @connuoc/shared-types typecheck
pnpm --filter @connuoc/weather-worker test
pnpm --filter @connuoc/weather-worker typecheck
pnpm --filter @connuoc/weather-worker build
```

Expected: exit 0 for every command.

- [ ] **Step 9: Commit Task 1**

```bash
git add packages/shared-types services/weather-worker
git commit -m "feat(rainfall): add normalized contracts and accumulation engine"
```

---

### Task 2: Rainfall persistence schema and database invariants

**Files:**
- Create: `infrastructure/database/migrations/0006_rainfall.sql`
- Modify: `services/api/scripts/db-smoke.mjs`
- Test: `services/api/test/rainfall.repository.integration.test.ts`
- Create: `services/api/src/modules/rainfall/rainfall.repository.ts`

**Interfaces:**
- `RainfallRepository.saveBundle(providerConfigId, bundle, staleAfterUtc)` returns a stable `runId` and is idempotent by provider/capability/normalized checksum.
- `RainfallRepository.saveAccumulations(location, endUtc, accumulations)` stores reproducible derived windows with source-record lineage.
- `RainfallRepository.findHistory(...)`, `findForecast(...)`, `findNearestLastKnownGood(...)` return normalized records without request-coordinate persistence.

- [ ] **Step 1: Write failing repository integration tests**

Require migration tables `rainfall_runs`, `rainfall_records`, `rainfall_accumulations` and prove duplicate normalized content does not create a second run.

- [ ] **Step 2: Run the repository test and verify RED**

```bash
pnpm --filter @connuoc/api exec vitest run test/rainfall.repository.integration.test.ts --maxWorkers=1
```

Expected: FAIL because migration 0006/tables/repository are missing.

- [ ] **Step 3: Add migration 0006 with hard constraints**

`rainfall_runs` stores provider/source/product metadata, capability, spatial point, optional resolution, fetched/model/observed timestamps, stale boundary, normalized checksum, optional object-storage URI and metadata.

`rainfall_records` stores valid interval, product kind, amount mm, quality state/flags and optional ensemble metadata.

`rainfall_accumulations` stores end time, window seconds restricted to `3600,10800,21600,43200,86400,259200,604800`, amount, coverage ratio `0..1`, completeness, derivation version and deterministic input record IDs/source IDs.

Add constraints so `valid_end > valid_start`, `accumulation_seconds = EXTRACT(EPOCH FROM valid_end-valid_start)`, amounts are non-negative, and `stale_after >= fetched_at`.

- [ ] **Step 4: Update DB smoke expectations**

Change deterministic migration order to 0001..0006, add the three rainfall tables and checks for no request-coordinate history columns, valid accumulation-window constraints and idempotency keys.

- [ ] **Step 5: Implement repository minimal persistence/query methods**

Use the existing pg/PostGIS patterns from `weather.repository.ts`; do not copy provider secrets or raw payload JSON into rainfall tables.

- [ ] **Step 6: Verify Task 2 GREEN**

```bash
pnpm --filter @connuoc/api db:migrate
pnpm --filter @connuoc/api db:smoke
pnpm --filter @connuoc/api exec vitest run test/rainfall.repository.integration.test.ts --maxWorkers=1
pnpm --filter @connuoc/api typecheck
```

Expected: exit 0.

- [ ] **Step 7: Commit Task 2**

```bash
git add infrastructure/database/migrations/0006_rainfall.sql services/api/scripts/db-smoke.mjs services/api/src/modules/rainfall/rainfall.repository.ts services/api/test/rainfall.repository.integration.test.ts
git commit -m "feat(rainfall): persist normalized rainfall history"
```

---

### Task 3: Provider adapters for fixture, Open-Meteo forecast rainfall and IMERG normalization

**Files:**
- Create: `services/weather-worker/src/rainfall-fixture.ts`
- Create: `services/weather-worker/src/open-meteo-rainfall.ts`
- Create: `services/weather-worker/src/imerg-normalizer.ts`
- Modify: `services/weather-worker/src/index.ts`
- Test: `services/weather-worker/test/rainfall-adapters.test.ts`

**Interfaces:**
- `RainfallProviderAdapter.fetchRainfall(request)` returns `NormalizedRainfallBundle`.
- `OpenMeteoRainfallAdapter` supports `rainfall.forecast` and normalizes provider-grid hourly precipitation/rain into one-hour `DETERMINISTIC_FORECAST` records.
- `normalizeImergGridCell(input)` converts a half-hour IMERG extraction/manifest into `SATELLITE_ESTIMATE` and preserves object-storage metadata; it does not download Earthdata files itself.

- [ ] **Step 1: Write failing adapter tests**

Require fixture examples for gauge, satellite and deterministic forecast; require Open-Meteo hourly precipitation to become one-hour rainfall intervals; require IMERG 30-minute cell values to retain product/version/resolution and object URI.

- [ ] **Step 2: Verify RED**

```bash
pnpm --filter @connuoc/weather-worker exec vitest run test/rainfall-adapters.test.ts
```

Expected: FAIL because adapters do not exist.

- [ ] **Step 3: Implement fixture and normalizers**

Fixture data must be clock-injected, like the final Phase 5B fixture fix, so CI never becomes time-of-day dependent.

- [ ] **Step 4: Implement Open-Meteo rainfall adapter**

Reuse `WeatherHttpClient`; request hourly `precipitation,rain`, UTC timestamps and preserve provider grid/timezone/source/model metadata. Do not silently treat model rain as observation.

- [ ] **Step 5: Verify Task 3 GREEN**

```bash
pnpm --filter @connuoc/weather-worker test
pnpm --filter @connuoc/weather-worker typecheck
pnpm --filter @connuoc/weather-worker build
```

Expected: exit 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add services/weather-worker
git commit -m "feat(rainfall): add forecast and satellite normalization adapters"
```

---

### Task 4: Runtime provider orchestration, fallback and last-known-good behavior

**Files:**
- Create: `services/api/src/modules/rainfall/rainfall-provider.repository.ts`
- Create: `services/api/src/modules/rainfall/rainfall-adapter.factory.ts`
- Create: `services/api/src/modules/rainfall/rainfall-orchestrator.ts`
- Create: `services/api/test/rainfall-orchestrator.test.ts`

**Interfaces:**
- Provider selection reuses the Phase 5A `selectProvider` policy and supports capabilities `rainfall.observed`, `rainfall.satellite`, `rainfall.radar`, `rainfall.forecast`.
- `RainfallOrchestrator.fetch(request)` returns provider config ID, freshness seconds, fallback state and normalized rainfall bundle.
- Failure codes remain bounded and secret-free.

- [ ] **Step 1: Write failing orchestration tests**

Test higher-priority disallowed provider → allowed fallback; live provider failure → next eligible provider; all live providers fail → service may use repository LKG only if spatially compatible and within stale grace.

- [ ] **Step 2: Verify RED**

```bash
pnpm --filter @connuoc/api exec vitest run test/rainfall-orchestrator.test.ts
```

- [ ] **Step 3: Implement minimal provider repository/factory/orchestrator**

Factory supports `fixture` and `open-meteo` rainfall adapters. IMERG ingestion remains an ingestion normalization path until a production-approved Earthdata/object-store fetcher is configured; do not fake a public live IMERG HTTP endpoint.

- [ ] **Step 4: Verify GREEN**

```bash
pnpm --filter @connuoc/api test
pnpm --filter @connuoc/api typecheck
```

- [ ] **Step 5: Commit Task 4**

```bash
git add services/api/src/modules/rainfall services/api/test/rainfall-orchestrator.test.ts
git commit -m "feat(rainfall): orchestrate provider fallback"
```

---

### Task 5: Public rainfall summary/history/forecast APIs

**Files:**
- Create: `services/api/src/modules/rainfall/rainfall.service.ts`
- Create: `services/api/src/modules/rainfall/rainfall.controller.ts`
- Create: `services/api/src/modules/rainfall/rainfall.module.ts`
- Modify: `services/api/src/app.module.ts`
- Test: `services/api/test/rainfall-api.integration.test.ts`
- Test: `services/api/test/phase5c-rainfall.integration.test.ts`

**Interfaces:**

```text
GET /v1/rainfall/summary?lat=&lon=&at=
GET /v1/rainfall/history?lat=&lon=&start=&end=&limit=
GET /v1/rainfall/forecast?lat=&lon=&hours=
```

`summary` returns available 1h/3h/6h/12h/24h/72h/7d windows, each with amount, coverage/completeness, product kinds, source lineage and derivation version.

`history` returns observed/estimated/reanalysis records explicitly labeled by `productKind`.

`forecast` returns forecast rainfall only; it never mixes an old observation into forecast records without an explicit separate section.

- [ ] **Step 1: Write failing API integration tests**

Require valid 200 responses, invalid-coordinate/time-range 400 responses, bounded 503 `RAINFALL_UNAVAILABLE` when no eligible live/LKG data exists, source/secret redaction and no stage/flood fields in recursive JSON.

- [ ] **Step 2: Verify RED**

```bash
pnpm --filter @connuoc/api exec vitest run test/rainfall-api.integration.test.ts test/phase5c-rainfall.integration.test.ts --maxWorkers=1
```

- [ ] **Step 3: Implement service/controller/module**

Controller validates latitude `-90..90`, longitude `-180..180`, forecast hours `1..168`, history interval order and bounded history limit. Service persists successful live bundles before serving them, derives accumulation windows from compatible normalized records and preserves last-known-good data on provider failure.

- [ ] **Step 4: Verify Task 5 GREEN**

```bash
pnpm --filter @connuoc/api test
pnpm --filter @connuoc/api test:integration
pnpm --filter @connuoc/api typecheck
pnpm --filter @connuoc/api build
```

Expected: exit 0.

- [ ] **Step 5: Commit Task 5**

```bash
git add services/api/src services/api/test
git commit -m "feat(rainfall): expose normalized public APIs"
```

---

### Task 6: Phase 5C documentation, source policy and immutable exit gate

**Files:**
- Create: `docs/PHASE-5C-RAINFALL.md`
- Modify: `docs/DATA-SOURCES.md`
- Create: `.github/workflows/phase5c-rainfall.yml`
- Modify after green: `docs/PROJECT-STATUS.md`
- Modify after green: `docs/ROADMAP.md`

**Interfaces:**
- Dedicated workflow proves migrations, shared contracts, rainfall worker tests/build, API unit/integration tests, focused Phase 5C scenario and API build on one immutable PR head.

- [ ] **Step 1: Write the dedicated workflow**

Workflow paths include shared types, weather-worker, rainfall API module, database migrations, source registry/data-source docs and Phase 5C docs.

- [ ] **Step 2: Add handoff/source documentation**

Document product-kind semantics, accumulation windows, incomplete-window behavior, LKG/stale policy, IMERG object-storage boundary, Open-Meteo licence deployment modes and explicit non-goals: no stage/flood probability.

- [ ] **Step 3: Run full local-equivalent verification**

```bash
pnpm install --frozen-lockfile
pnpm --filter @connuoc/api db:migrate
pnpm --filter @connuoc/api db:smoke
pnpm --filter @connuoc/shared-types typecheck
pnpm --filter @connuoc/shared-types test
pnpm --filter @connuoc/weather-worker typecheck
pnpm --filter @connuoc/weather-worker test
pnpm --filter @connuoc/weather-worker build
pnpm --filter @connuoc/api typecheck
pnpm --filter @connuoc/api test
pnpm --filter @connuoc/api exec vitest run test/phase5c-rainfall.integration.test.ts --maxWorkers=1
pnpm --filter @connuoc/api test:integration
pnpm --filter @connuoc/api build
```

Expected: all commands exit 0.

- [ ] **Step 4: Update project status only after fresh evidence**

Mark #55 complete only after the dedicated Phase 5C workflow and existing CI/Public API/Admin/Queue/Ingestion/Phase 2/Phase 5A/Phase 5B regression gates are green on the same immutable head.

- [ ] **Step 5: Commit Task 6**

```bash
git add .github/workflows/phase5c-rainfall.yml docs
git commit -m "docs(rainfall): add Phase 5C handoff and exit gate"
```

---

## Self-Review

### Spec coverage
- First-class gauge/radar/satellite/reanalysis/deterministic/ensemble/blended taxonomy: Task 1.
- Native interval/resolution/source metadata: Tasks 1–3.
- 1h/3h/6h/12h/24h/72h/7d derived windows and missing-data behavior: Task 1 + Task 2 persistence.
- IMERG path and large-grid object-storage boundary: Task 3 + Task 6.
- Weather-model forecast rainfall: Task 3.
- Provenance/idempotency/LKG: Tasks 2 and 4.
- Public summary/history/forecast endpoints: Task 5.
- No flood/stage claims: global constraint + API tests + docs.
- Source/licence rules: provider platform reuse + Task 6.

### Placeholder scan
The plan contains no implementation placeholders. Each task names concrete files, interfaces, verification commands and acceptance behavior.

### Type consistency
`RainfallRecord` is the common unit across adapters, persistence, accumulation and APIs. `NormalizedRainfallBundle` is provider output. `RainfallAccumulation` is derived only from normalized records and always carries derivation version plus lineage. Public APIs expose normalized domain contracts and never provider runtime configuration.

## Execution Handoff

Plan saved at `docs/superpowers/plans/2026-09-17-phase5c-rainfall-intelligence.md`.

The current user request already authorizes continuation in this session, so execution mode is **Inline Execution** with TDD checkpoints. The implementation must stop short of any completion claim until fresh verification evidence exists for the relevant task/phase.