# Phase 5B Multi-Provider Weather Forecasts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver vendor-neutral current/hourly/daily weather APIs with deterministic multi-provider fallback, provenance, freshness/stale semantics, Open-Meteo support, and privacy-safe forecast history hooks.

**Architecture:** Extend `@connuoc/shared-types` with strict normalized weather contracts, extend `@connuoc/weather-worker` with forecast-capable fixture/Open-Meteo adapters using injected HTTP transport, then add an API-side provider runtime/orchestrator and PostGIS-backed normalized weather cache. Public APIs never bind to vendor payloads, never expose admin provider keys/secrets, and persist provider grid cells rather than exact user-request coordinates.

**Tech Stack:** TypeScript, Zod, Node.js 24 built-in `fetch`, NestJS/Fastify, PostgreSQL 18 + PostGIS 3.6, Vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-17-weather-hydrology-intelligence-design.md`

## Global Constraints

- Parent issue: #54. Execution children: #64–#101 created during decomposition; related work is grouped into the reviewable tasks below rather than implemented as one commit per micro-issue.
- Public endpoints: `GET /v1/weather/current`, `GET /v1/weather/hourly`, `GET /v1/weather/daily`.
- Capability mapping is exact: current → `weather.current`, hourly → `weather.hourlyForecast`, daily → `weather.dailyForecast`.
- Public hourly horizon is 1–168 hours; public daily horizon is 1–15 days.
- Units are normalized to Celsius, percent RH/cloud/probability, hPa, m/s, degrees, metres visibility, and millimetres precipitation/rain.
- All provider requests use UTC output; provider valid timestamps are normalized to explicit UTC instants.
- `MODEL_CURRENT` is not relabeled as `OBSERVED`; forecast values remain `FORECAST`.
- `modelRunAt` is nullable. Open-Meteo `generationtime_ms` is processing duration and must not be used as model-run time.
- Open-Meteo free hosted service is non-commercial; commercial deployments may use reviewed paid/self-hosted configurations only. Source policy remains fail-closed.
- CI uses deterministic fixtures/injected HTTP transport only; no required test calls a live weather API.
- Exact end-user request coordinates are not persisted as history. Persist provider-resolved grid points and query stale cache by nearest eligible grid point.
- Stale lookup maximum distance is 25 km. A stale value must carry `STALE`; it is never presented as fresh/current.
- Public output exposes stable source-registry id, attribution, model, temporal/spatial provenance and fallback-used state, but never `providerKey`, `secretRef`, API keys, endpoint credentials, admin metadata or raw upstream response bodies.
- Initial Open-Meteo adapter uses one model per provider config: `modelAllowList[0]`, otherwise `best_match`. Phase 5B does not synthesize a cross-model consensus.
- Full billing/cost dashboards remain #60; Phase 5B records request latency/failure health evidence and honors existing selector policy inputs.

---

### Task 1: Normalized weather contracts (#64, #75, #81, #83, #84, #92, #93, #94, #100)

**Files:**
- Create: `packages/shared-types/src/weather.ts`
- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/test/weather.test.ts`

**Interfaces:**
- Produces `WeatherCapabilityRequest`, `WeatherSourceProvenance`, `WeatherGridLocation`, `WeatherFreshness`, `CurrentWeatherRecord`, `HourlyWeatherPoint`, `DailyWeatherPoint`, and the three public response schemas.
- `WeatherSourceProvenance` contains `sourceId`, `attributionText`, `attributionUrl`, `modelId`, `modelRunAt: string | null`, and `fetchedAt`; it contains no admin provider identifier.

- [ ] **Step 1: Write failing contract tests**

```ts
it('distinguishes model-current from forecast and allows an undisclosed model run time', () => {
  expect(CurrentWeatherRecordSchema.parse({
    kind: 'MODEL_CURRENT',
    validAt: '2026-09-17T01:00:00Z',
    temperatureC: 29.2,
    relativeHumidityPct: 82,
    pressureHpa: 1007.4,
    windSpeedMs: 2.3,
    windDirectionDeg: 110,
    weatherCode: 61,
  }).kind).toBe('MODEL_CURRENT');
  expect(WeatherSourceProvenanceSchema.parse({
    sourceId: 'open-meteo-paid-hosted',
    attributionText: 'Open-Meteo',
    attributionUrl: 'https://open-meteo.com/',
    modelId: 'best_match',
    modelRunAt: null,
    fetchedAt: '2026-09-17T01:01:00Z',
  }).modelRunAt).toBeNull();
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/shared-types test -- weather.test.ts`
Expected: FAIL because `weather.ts`/schemas do not exist.

- [ ] **Step 3: Implement strict Zod contracts**

Required normalized shapes:

```ts
export type WeatherFreshnessState = 'FRESH' | 'STALE';
export interface WeatherGridLocation {
  spatialRepresentation: 'GRID_CELL';
  latitude: number;
  longitude: number;
  timeZone: string;
  distanceFromRequestKm: number | null;
}
export interface WeatherSourceProvenance {
  sourceId: string;
  attributionText: string;
  attributionUrl: string | null;
  modelId: string;
  modelRunAt: string | null;
  fetchedAt: string;
}
```

Metric ranges must reject impossible percentages/directions and non-finite numbers. Optional provider metrics remain nullable/optional; identity/time/spatial fields remain mandatory.

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter @connuoc/shared-types typecheck && pnpm --filter @connuoc/shared-types test`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(weather): add normalized weather contracts`

---

### Task 2: Forecast-capable fixture adapter and Open-Meteo parser (#64, #72, #73, #76, #86, #96, #97, #98, #99, #101)

**Files:**
- Create: `services/weather-worker/src/weather-contracts.ts`
- Create: `services/weather-worker/src/open-meteo.ts`
- Create: `services/weather-worker/test/open-meteo.test.ts`
- Create: `services/weather-worker/test/fixtures/open-meteo-success.json`
- Create: `services/weather-worker/test/fixtures/open-meteo-optional.json`
- Modify: `services/weather-worker/src/contracts.ts`
- Modify: `services/weather-worker/src/fixture-provider.ts`
- Modify: `services/weather-worker/src/index.ts`
- Test: `services/weather-worker/test/contracts.test.ts`, `services/weather-worker/test/open-meteo.test.ts`

**Interfaces:**

```ts
export interface WeatherForecastRequest {
  capability: 'weather.current' | 'weather.hourlyForecast' | 'weather.dailyForecast';
  latitude: number;
  longitude: number;
  hours?: number;
  days?: number;
}

export interface WeatherForecastAdapter extends WeatherHydrologyProviderAdapter {
  fetchWeather(request: WeatherForecastRequest, signal?: AbortSignal): Promise<NormalizedWeatherBundle>;
}

export interface WeatherHttpClient {
  getJson(url: URL, signal?: AbortSignal): Promise<unknown>;
}
```

- [ ] **Step 1: Write failing adapter tests**

Tests must assert URL construction includes `timezone=UTC`, `temperature_unit=celsius`, `wind_speed_unit=ms`, `precipitation_unit=mm`, exact capability variables and bounded horizons. Tests also assert 429/5xx/network timeout becomes typed retryable failure and malformed array lengths become a source-payload error.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/weather-worker test`
Expected: FAIL because forecast adapter/Open-Meteo implementation does not exist.

- [ ] **Step 3: Extend fixture adapter**

`fixture-weather` returns deterministic current/hourly/daily bundles using provider grid `19.50, 105.50`, source id `synthetic-weather-fixture`, explicit `fetchedAt`, `modelId='fixture-model'`, and `modelRunAt='2026-09-17T00:00:00Z'`.

- [ ] **Step 4: Implement Open-Meteo adapter**

Use `URL`/`URLSearchParams`, never string concatenation for credentials. Parse only the normalized metric set. With no configured model use `best_match`; with `modelAllowList[0]` add `models=<model>`. Paid endpoint receives `apikey` only after server-side secret resolution; the key must never be included in thrown error messages or serialized diagnostics.

- [ ] **Step 5: Run GREEN**

Run: `pnpm --filter @connuoc/weather-worker typecheck && pnpm --filter @connuoc/weather-worker test && pnpm --filter @connuoc/weather-worker build`
Expected: PASS with no external network access.

- [ ] **Step 6: Commit**

Commit message: `feat(weather-worker): add forecast adapters`

---

### Task 3: Weather forecast persistence and nearest-grid history hooks (#69, #82, #87, #89, #90, #95)

**Files:**
- Create: `infrastructure/database/migrations/0005_weather_forecasts.sql`
- Modify: `services/api/scripts/db-smoke.mjs`
- Create: `services/api/src/modules/weather/weather.repository.ts`
- Test: `services/api/test/weather.repository.integration.test.ts`
- Modify all existing integration-test TRUNCATE lists that must include the new weather tables.

**Interfaces:**
- `saveBundle(providerConfigId, bundle, freshnessSeconds): Promise<string>` stores provider grid, normalized records and checksum.
- `findNearestCached(capability, coordinate, maxDistanceKm, now): Promise<CachedWeatherBundle | null>` returns provider-grid data only.

**Schema:**

```sql
CREATE TABLE weather_forecast_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_config_id uuid NOT NULL REFERENCES provider_configs(id) ON DELETE RESTRICT,
  source_registry_id text NOT NULL,
  capability text NOT NULL,
  provider_grid geometry(Point,4326) NOT NULL,
  provider_timezone text NOT NULL,
  model_id text NOT NULL,
  model_run_at timestamptz,
  fetched_at timestamptz NOT NULL,
  stale_after timestamptz NOT NULL,
  normalized_checksum text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
```

Separate current/hourly/daily child tables store only normalized fields and valid time/date. Add GiST grid index and deterministic de-duplication on provider/config/capability/grid/model/fetched-or-checksum identity.

- [ ] **Step 1: Write migration/repository integration tests**

Assert migration works on empty PostGIS, exact request coordinates are absent from schema, repeated identical bundle save is idempotent, and nearest-grid lookup rejects a cached point farther than 25 km.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/api db:migrate && pnpm --filter @connuoc/api exec vitest run test/weather.repository.integration.test.ts --maxWorkers=1`
Expected: FAIL before migration/repository exists.

- [ ] **Step 3: Implement migration and repository**

Compute `normalized_checksum` from public-safe normalized bundle content and provenance only; never include `secretRef`, endpoint config or raw provider payload.

- [ ] **Step 4: Run GREEN and regression smoke**

Run: `pnpm --filter @connuoc/api db:smoke && pnpm --filter @connuoc/api exec vitest run test/weather.repository.integration.test.ts --maxWorkers=1`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(weather): persist normalized forecast history`

---

### Task 4: Runtime provider loader, secret resolver and deterministic fallback (#65, #68, #71, #73, #80, #88)

**Files:**
- Create: `services/api/src/modules/weather/weather-provider.repository.ts`
- Create: `services/api/src/modules/weather/weather-secret.resolver.ts`
- Create: `services/api/src/modules/weather/weather-adapter.factory.ts`
- Create: `services/api/src/modules/weather/weather-orchestrator.ts`
- Modify: `services/api/package.json` (`@connuoc/weather-worker` workspace dependency; build it in `prepare:deps`)
- Test: `services/api/test/weather-orchestrator.test.ts`
- Test: `services/api/test/weather-provider.repository.integration.test.ts`

**Interfaces:**

```ts
export interface WeatherRuntimeProvider {
  providerId: string;
  providerKey: string; // internal only
  providerType: string;
  sourceRegistryId: string;
  endpointConfig: { baseUrl?: string; timeoutMs?: number };
  secretRef: string | null;
  modelAllowList: string[];
  freshnessSeconds: number;
  selectable: SelectableProviderConfig;
  attribution: { text: string; url: string | null };
}
```

`EnvironmentWeatherSecretResolver` accepts only `env://VARIABLE_NAME`; missing/unsupported references become typed provider failures. Fixture providers do not resolve secrets.

- [ ] **Step 1: Write RED tests**

Cover preferred success, policy-blocked preferred skip, retryable preferred fetch failure → second provider, unsupported secret reference → next provider, health/coverage rejection, and no provider available.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/api test -- weather-orchestrator.test.ts`
Expected: FAIL because runtime orchestration does not exist.

- [ ] **Step 3: Implement provider loader/factory/orchestrator**

Use existing `selectProvider` candidate ordering. Iterate only accepted candidates. Record `provider_health_events` with bounded failure code/latency; never store arbitrary upstream body or credentials. Public result contains only selected source attribution plus `fallbackUsed: boolean`.

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter @connuoc/api typecheck && pnpm --filter @connuoc/api test && pnpm --filter @connuoc/api exec vitest run test/weather-provider.repository.integration.test.ts --maxWorkers=1`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(weather): orchestrate provider fallback`

---

### Task 5: Fresh/stale/unavailable weather service (#65, #74, #89, #90, #91)

**Files:**
- Create: `services/api/src/modules/weather/weather.service.ts`
- Test: `services/api/test/weather.service.test.ts`

**Interfaces:**
- `getCurrent(requestCoordinate)`
- `getHourly(requestCoordinate, hours)`
- `getDaily(requestCoordinate, days)`

- [ ] **Step 1: Write RED tests**

Required state machine:

```text
live provider succeeds -> persist provider-grid bundle -> FRESH
all live providers fail + eligible nearest cache exists -> STALE
all live providers fail + cache expired/outside 25 km -> WEATHER_UNAVAILABLE
```

A provider `freshnessPolicy.maxAgeSeconds` sets `staleAfter`. Configure a bounded fallback grace (`maxStaleAgeSeconds`) in service policy, initially 21,600 seconds (6 hours) for current/hourly and 43,200 seconds (12 hours) for daily.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/api test -- weather.service.test.ts`
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement minimal state machine**

Never change cached point timestamps to look fresh. STALE response preserves original `fetchedAt`, `modelRunAt`, valid time and provider grid.

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter @connuoc/api test -- weather.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(weather): add freshness fallback policy`

---

### Task 6: Normalized public weather APIs and OpenAPI (#66, #70, #77, #79, #85)

**Files:**
- Create: `services/api/src/modules/weather/weather.controller.ts`
- Create: `services/api/src/modules/weather/weather.module.ts`
- Modify: `services/api/src/app.module.ts`
- Modify: `services/api/src/openapi.ts` only where explicit component schemas are needed
- Test: `services/api/test/weather.controller.test.ts`
- Test: `services/api/test/weather-api.integration.test.ts`

**Interfaces:**

```text
GET /v1/weather/current?lat=19.5&lon=105.5
GET /v1/weather/hourly?lat=19.5&lon=105.5&hours=48
GET /v1/weather/daily?lat=19.5&lon=105.5&days=7
```

- [ ] **Step 1: Write RED controller/integration tests**

Assert strict coordinate bounds, hourly 1–168, daily 1–15, `FRESH` fixture path, deterministic fallback, `STALE` cache path, 503 `WEATHER_UNAVAILABLE`, attribution/model/grid metadata, and recursive absence of `providerKey`, `secretRef`, API-key canaries and endpoint config.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @connuoc/api test -- weather.controller.test.ts` and the focused integration file with PostGIS.
Expected: FAIL because routes/module do not exist.

- [ ] **Step 3: Implement controller/module**

Use short HTTP cache headers while preserving application freshness state:
- current: `public, max-age=60, stale-while-revalidate=120`
- hourly: `public, max-age=300, stale-while-revalidate=600`
- daily: `public, max-age=900, stale-while-revalidate=1800`

503 body is bounded:

```json
{
  "statusCode": 503,
  "code": "WEATHER_UNAVAILABLE",
  "message": "Weather data is temporarily unavailable."
}
```

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter @connuoc/api typecheck && pnpm --filter @connuoc/api test && pnpm --filter @connuoc/api test:integration && pnpm --filter @connuoc/api build`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(api): add normalized weather endpoints`

---

### Task 7: Source documentation, dedicated gate and Phase 5B handoff (#67, #70, #78)

**Files:**
- Create: `docs/PHASE-5B-WEATHER-FORECASTS.md`
- Modify: `docs/DATA-SOURCES.md`
- Modify: `services/weather-worker/README.md`
- Modify: `docs/ROADMAP.md` only to mark #54 complete after merge evidence is available
- Create: `.github/workflows/phase5b-weather.yml`
- Create: `services/api/test/phase5b-weather.integration.test.ts`

**Gate:**

The dedicated workflow uses PostGIS and runs:

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
pnpm --filter @connuoc/api exec vitest run test/phase5b-weather.integration.test.ts --maxWorkers=1
pnpm --filter @connuoc/api test:integration
pnpm --filter @connuoc/api build
```

- [ ] **Step 1: Add focused end-to-end fixture test**

Scenario proves current/hourly/daily responses, policy-blocked preferred provider, runtime fetch fallback, persisted provider-grid cache, stale fallback and hard unavailable behavior with no public provider-key/secret leakage.

- [ ] **Step 2: Add workflow and documentation**

Document current Open-Meteo terms review dated 2026-09-17: free hosted is non-commercial; paid customer endpoint supports commercial use; API data requires CC BY 4.0 attribution. Document that pricing/terms are external and must be re-reviewed before production rollout.

- [ ] **Step 3: Run full local/CI-equivalent verification**

Expected: all commands above exit 0.

- [ ] **Step 4: Commit**

Commit message: `test(weather): add Phase 5B exit gate`

---

### Task 8: PR, review and immutable-head merge (#54, #78)

**Files:** no production changes unless review identifies a concrete defect.

- [ ] **Step 1: Open draft PR from `phase-5/weather-forecasts-active` to `main`**

PR body must include `Closes #54`, child issue mapping, explicit non-goals (#55 rainfall, #56 river discharge, #58 flood risk, #61 mobile/web UI), source/licence evidence and verification head SHA.

- [ ] **Step 2: Review changed-file scope/security**

Verify no `apps/mobile/**` changes, no provider secret/API key in diff, no raw upstream payload logging, and no rainfall/river/flood calculation sneaked into Phase 5B.

- [ ] **Step 3: Require fresh workflows on one immutable head**

Required checks: CI, Public API Integration, Admin Integration, Queue Integration, Ingestion Integration, Phase 2 Backend Exit Gate, Phase 5A Provider Foundation, and new Phase 5B Weather gate.

- [ ] **Step 4: Resolve all review threads, mark ready, merge with expected-head guard**

Use squash merge only after every required run is SUCCESS on the same head SHA.

- [ ] **Step 5: Verify #54 is closed and `main` contains the merge commit**

Then update roadmap checkbox to complete only if the merge commit itself is present on `main`.

## Self-review result

- Spec coverage: weather current/hourly/daily, normalized provider-neutral contracts, source/model provenance, fallback, freshness, source licensing, privacy-safe history hooks and public API behavior are mapped to Tasks 1–7.
- Deliberate boundary: no rainfall feature engineering, river discharge, stage conversion, flood-risk calculation, or mobile/web UI is implemented in Phase 5B.
- Consensus boundary: Phase 5B retains model identity and does not invent a consensus. Comparable multi-model consensus can be added later without breaking the contract.
- Type consistency: `WeatherForecastRequest`, `NormalizedWeatherBundle`, `WeatherSourceProvenance`, grid/freshness semantics and endpoint capability names are consistent across tasks.
- Placeholder scan: the plan contains no unresolved implementation placeholders; every task has named files, interfaces, RED/GREEN commands and commit boundary.
